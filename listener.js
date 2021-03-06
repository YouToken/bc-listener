'use strict';

const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const moment = require('moment');
const defaults = require('./defaults');
const chain = require('./chain');

class Listener extends EventEmitter {
  log(level, msg) {
    let s = 'listener';
    if (this.id) s += `:${this.id}`;
    this.logger[level](`${s} ${msg}`);
  }

  constructor(config) {
    super();
    required('config', config);
    required('config.provider', config.provider);
    required('config.txProcessors', config.txProcessors);
    required('config.storage', config.storage);

    this.logger = config.logger ? config.logger : defaults.logger;
    this.logger.debug('creating listener');

    let currency = config.provider.getCurrency();
    let settings = _.pick(config, _.keys(defaults.config));
    getter(this, 'provider', config.provider);
    getter(this, 'txProcessors', config.txProcessors);
    getter(this, 'storage', _.defaults(config.storage, defaults.storage(currency, this.logger)));
    getter(this, 'config', parseConfig(_.defaults(settings, defaults.config)));

    getter(this, 'id', _.uniqueId(`${currency}_`));

    this.log('debug', `listener created with config: ${JSON.stringify(this.config)}`);
  }

  makeChain() {
    this.log('debug', 'creating new chain');
    return chain({
      clearUnconfirmed: async unconfirmedBlocks => {
        this.log('debug', `clear unconfirmed blocks: ${JSON.stringify(unconfirmedBlocks.map(b => b.hash))}`);
        for (let i = 0; i < unconfirmedBlocks.length; i++) {
          await this.storage.clearUnconfirmed(unconfirmedBlocks[i].hash);
          this.emit('clear_unconfirmed', unconfirmedBlocks[i]);
        }
      },
      saveUnconfirmed: async unconfirmedBlocks => {
        this.log('debug', `save unconfirmed blocks: ${JSON.stringify(unconfirmedBlocks.map(b => b.hash))}`);
        for (let i = 0; i < unconfirmedBlocks.length; i++) {
          await this.storage.saveUnconfirmed(unconfirmedBlocks[i].hash, unconfirmedBlocks[i].txs);
          this.emit('save_unconfirmed', unconfirmedBlocks[i]);
        }
      },
      confirm: async confirmedBlocks => await this.confirm(confirmedBlocks),
      isParent(parentBlock, childBlock) {
        return childBlock.prev_hash === parentBlock.hash;
      }
    }, this.config.confirmations, this.logger);
  }

  async confirm(confirmedBlocks) {
    this.log('debug', `confirm blocks: ${JSON.stringify(confirmedBlocks.map(b => b.hash))}`);
    for (let i = 0; i < confirmedBlocks.length; i++) {
      await this.storage.saveTransactions(confirmedBlocks[i].hash, confirmedBlocks[i].txs);
      await this.storage.clearUnconfirmed(confirmedBlocks[i].hash);
      this.emit('clear_unconfirmed', confirmedBlocks[i]);
      this.emit('save_transactions', confirmedBlocks[i]);
    }
  }

  isPlaying() {
    return !!this.timer
  }

  async play() {
    await this._tick();
    let self = this;

    self.timer = setTimeout(async function timer() {
      await self._tick();
      self.timer = setTimeout(timer, self.config.update_interval);
    }, self.config.update_interval);
    this.emit('play');
    this.log('info', 'listener played');
  }

  async _tick() {
    try {
      await this.worker('saved', 'latest', true, this.mainChain);
      await this.proceedPool();
    } catch (e) {
      this.logger.error(e);
    }
  }

  async pause() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.emit('pause');
    this.log('info', 'listener paused');
  }

  async start(from = this.config.start_height) {
    this.mainChain = this.makeChain();
    try {
      await this.worker(from, 'latest', true, this.mainChain);
    } catch (e) {
      this.logger.error(e);
    }
    await this.play();
    this.emit('start');
    this.log('info', 'listener started');
  }

  async stop() {
    await this.pause();
    this.mainChain.clear();
    this.mainChain = null;
    this.emit('stop');
    this.log('info', 'listener stopped');
  }

  async proceedPool() {
    this.log('debug', 'proceeding pool started');
    await this.storage.clearUnconfirmed('pool');
    let pool = await this.provider.getPool();
    for (let i = 0; i < pool.length; i++) {
      pool[i] = {
        original: pool[i],
        processed: await this.proceedTransaction(pool[i])
      };
    }
    await this.storage.saveUnconfirmed('pool', pool);
    this.emit('from_pool', pool);
    this.log('debug', 'proceeding pool finished');
  }

  async worker(from, to, update_height, chain) {
    this.log('debug', `worker started: from=${from}, to=${to}, update_height=${update_height}, chain=${chain === this.mainChain ? 'mainChain' : 'custom'}`);
    if (!chain) throw Error(`chain is not specified: ${chain}`);
    let fromBlock = from === 'saved' ? (await this.storage.loadHeight()) : +from;
    let toBlock = to === 'latest' ? (await this.provider.getHeight()) : +to;
    this.log('info', `worker parsed: from=${fromBlock}, to=${toBlock}`);
    if (!_.isNumber(fromBlock)) throw new Error(`fromBlock is not a number: ${fromBlock} (<-${from})`);
    if (!_.isNumber(toBlock)) throw new Error(`toBlock is not a number: ${toBlock} (<-${to})`);
    if (update_height) {
      await this.storage.saveHeight(fromBlock);
      this.emit('save_height', fromBlock);
    }
    for (let i = fromBlock; i <= toBlock; i++) {
      this.log('info', `start processing block ${i}`);
      let block = await this.provider.getBlock(i);
      let standardTxs = [];
      let instantTxs = [];
      for (let j = 0; j < block.txs.length; j++) {
        let processed = await this.proceedTransaction(block.txs[j]);
        let standard = processed.filter(tx => !tx.instant);
        if (standard.length) {
          standardTxs.push({
            original: block.txs[j],
            processed: standard
          });
        }
        let instant = processed.filter(tx => tx.instant);
        if (instant.length) {
          instantTxs.push({
            original: block.txs[j],
            processed: instant
          });
        }
      }

      // confirm instant txs
      try {
        await this.confirm([{
          height: block.height,
          hash: block.hash,
          prev_hash: block.prev_hash,
          txs: instantTxs
        }]);
      } catch (e) {
        this.logger.error(e);
      }

      // send standard txs to the chain
      try {
        chain.push({
          height: block.height,
          hash: block.hash,
          prev_hash: block.prev_hash,
          txs: standardTxs
        });
      } catch (e) {
        if (e.message !== 'parent not found') throw e;
        // it is probably a blockchain fork, rescan last blocks
        this.logger.warn(e);
        chain.clear();
        i -= this.config.confirmations + 1;
      }
    }
    if (update_height) {
      await this.storage.saveHeight(toBlock + 1);
      this.emit('save_height', toBlock + 1);
    }
    this.log('debug', 'worker finished');
  }

  async proceedTransaction(tx, block) {
    let txs = this.txProcessors.map(processor => processor.proceedTransaction(tx, block));
    let processed = await Promise.all(txs);
    return _.flatten(processed);
  }

  async resync(from = 'saved', to = 'latest') {
    this.log('info', `resync started: from=${from}, to=${to}`);
    let playing = this.isPlaying();
    if (playing) await this.pause();
    let chain = this.makeChain();
    await this.worker(from, to, false, chain);
    let latest = await this.provider.getHeight();
    let unconfirmedBlocks = chain.getUnconfirmed();
    this.log('debug', `resync proceed unconfirmed ${unconfirmedBlocks.length} blocks: latest=${latest}`);
    for (let i = 0; i < unconfirmedBlocks.length; i++) {
      let block = unconfirmedBlocks[i];
      if (block.height < latest - this.config.confirmations) {
        this.log('info', `resync proceed block #${block.height}`);
        await this.storage.clearUnconfirmed(block.hash);
        this.emit('clear_unconfirmed', block);
        await this.storage.saveTransactions(block.height, block.txs);
        this.emit('save_transactions', block);
      }
    }
    if (playing) await this.play();
    this.log('debug', `resync finished`);
  }
}

function required(name, val) {
  if (!val) throw new Error(`${name} is not specified`);
}

function getter(obj, name, value) {
  Object.defineProperty(obj, name, {
    get() {return value},
    set() {throw Error('You cannot change this property');}
  })
}

function parseConfig(config) {
  let update_interval = config.update_interval;
  if (!_.isString(update_interval) && !_.isNumber(update_interval)) throw new Error(`Invalid update interval: ${this.config.update_interval}`);
  if (_.isString(update_interval)) {
    let [a, b] = update_interval.trim().split(' ');
    let duration = moment.duration(+a, b);
    update_interval = duration.asMilliseconds();
  }
  config.update_interval = update_interval;
  return config;
}

module.exports = Listener;
