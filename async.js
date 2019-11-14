"use strict";

const Listener = require("./index");
const _ = require("lodash");
const { default: PQueue } = require("p-queue");

class AsyncListener extends Listener {
  constructor(config) {
    super(config);
    this.async = _.defaults(config.async, {
      blocks: 10,
      txs: 5,
      timeout: 5000
    }); //async proceed 10 blocks and 5 txs in a block and 5 sec timeout for ready
  }

  async worker(from, to, update_height, chain) {
    this.log(
      "debug",
      `worker started: from=${from}, to=${to}, update_height=${update_height}, chain=${
        chain === this.mainChain ? "mainChain" : "custom"
      }`
    );

    if (!chain) throw Error(`chain is not specified: ${chain}`);

    let fromBlock = from === "saved" ? await this.storage.loadHeight() : +from;
    let toBlock = to === "latest" ? await this.provider.getHeight() : +to;

    this.log("info", `worker parsed: from=${fromBlock}, to=${toBlock}`);

    if (!_.isNumber(fromBlock))
      throw new Error(`fromBlock is not a number: ${fromBlock} (<-${from})`);

    if (!_.isNumber(toBlock))
      throw new Error(`toBlock is not a number: ${toBlock} (<-${to})`);

    if (update_height) {
      await this.storage.saveHeight(fromBlock);
      this.emit("save_height", fromBlock);
    }

    const queue = new PQueue({
      concurrency: this.async.blocks,
      timeout: this.async.timeout
    });

    fork: for (let i = fromBlock; i <= toBlock; i += this.async.blocks) {
      let puck = [];
      let lastBlock = _.min([i + this.async.blocks, toBlock]);

      for (let k = i; k < lastBlock; k++) {
        queue.add(async () => {
          try {
            puck.push(await this._processBlock(k));
          } catch (e) {
            e.message = `BlockProceedError: #${k}, ${e.message}`;
            this.logger.error(e);
          }
        });
      }

      this.log("info", `queue filled, ${lastBlock}`);
      await queue.onIdle();
      this.log("info", `queue finished, ${lastBlock}`);

      for (let b of _.sortBy(puck, "height")) {
        try {
          chain.push(b);
        } catch (e) {
          if (e.message !== "parent not found") {
            this.logger.error(e);
            continue;
          }
          // it is probably a blockchain fork, rescan last blocks
          e.message += JSON.stringify(b);
          this.logger.warn(e);
          chain.clear();
          i = +b.height - this.config.confirmations + 1;
          this.log("info", `rollback to ${i} (${b.height} - ${this.config.confirmations})`);
          continue fork;
        }
      }

      if (update_height) {
        await this.storage.saveHeight(lastBlock);
        this.emit("save_height", lastBlock);
      }
    }
    this.log("debug", "worker finished");
  }

  async _processBlock(i) {
    this.log("info", `start processing block ${i}`);

    let block = await this.provider.getBlock(i);

    let processedBlock = {
      height: block.height,
      hash: block.hash,
      prev_hash: block.prev_hash,
      txs: []
    };

    if (!block.txs.length) return processedBlock;

    this.log("info", `${block.txs.length} txs in block ${block.height}`);

    const queue = new PQueue({
      concurrency: this.async.txs,
      timeout: this.async.timeout
    });

    for (let j = 0; j < block.txs.length; j += this.async.txs) {
      let instantTxs = [];
      let lastTx = _.min([j + this.async.txs, block.txs.length]);

      for (let k = j; k < lastTx; k++) {
        let tx = block.txs[k];
        queue.add(async () => {
          let processed = await this.provider.proceedTransaction(tx, block);

          if (!processed.length) return;

          let standard = processed.filter(tx => !tx.instant);
          let instant = processed.filter(tx => tx.instant);

          standard.length &&
            processedBlock.txs.push({
              original: tx,
              processed: standard
            });
          instant.length &&
            instantTxs.push({
              original: tx,
              processed: instant
            });
        });
      }

      await queue.onIdle();

      if (instantTxs.length) {
        try {
          this.confirm([
            {
              height: block.height,
              hash: block.hash,
              prev_hash: block.prev_hash,
              txs: instantTxs
            }
          ]);
        } catch (e) {
          this.logger.error(e);
        }
      }
    }

    return processedBlock;
  }

  async _proceedTx(tx, block) {
    let processed = await this.provider.proceedTransaction(tx, block);

    if (!processed.length) return { standard: [], instant: [] };

    let standard = processed.filter(tx => !tx.instant);
    let instant = processed.filter(tx => tx.instant);

    return { standard, instant };
  }
}

module.exports = AsyncListener;
