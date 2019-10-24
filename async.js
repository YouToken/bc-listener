"use strict";

const Listener = require("./index");
const _ = require("lodash");
const { default: PQueue } = require("p-queue");

class AsyncListener extends Listener {
  constructor(config) {
    super(config);
    this.async = _.defaults(config.async, {
      blocks: 20,
      txs: 5
    }); //async proceed 5 blocks and 10 txs in a block
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

    const q = new PQueue({ concurrency: this.async.blocks });

    fork: for (let i = fromBlock; i <= toBlock; i += this.async.blocks) {
      console.time(`${this.async.blocks} blocks from ${i}`);

      let puck = [];
      let lastBlock = _.min([i + this.async.blocks, toBlock]);

      for (let k = i; k < lastBlock; k++) {
        q.add(async () => {
          console.time(`Block #${k}`);
          puck.push(await this._proceedBlock(k));
          console.timeEnd(`Block #${k}`);
        });
      }

      this.log("info", `all, ${lastBlock}`);
      await q.onIdle();
      this.log("info", `end, ${lastBlock}`);

      for (let b of _.sortBy(puck, "height")) {
        try {
          chain.push(b);
        } catch (e) {
          if (e.message !== "parent not found") throw e;
          // it is probably a blockchain fork, rescan last blocks
          e.message += JSON.stringify(b);
          this.logger.warn(e);
          chain.clear();
          i = +b.height - this.config.confirmations + 1;
          continue fork;
        }
      }

      if (update_height) {
        await this.storage.saveHeight(lastBlock);
        this.emit("save_height", lastBlock);
      }

      console.timeEnd(`${this.async.blocks} blocks from ${i}`);
    }
    this.log("debug", "worker finished");
  }

  async _proceedBlock(i) {
    this.log("info", `worker proceed block #${i}`);

    let block = await this.provider.getBlock(i);

    let proccededBlock = {
      height: block.height,
      hash: block.hash,
      prev_hash: block.prev_hash,
      txs: []
    };

    if (!block.txs.length) return proccededBlock;

    this.log("info", `${block.txs.length} in block ${block.height}`);

    const q = new PQueue({ concurrency: this.async.txs });

    for (let j = 0; j < block.txs.length; j += this.async.txs) {
      let instantTxs = [];
      let lastTx = _.min([j + this.async.txs, block.txs.length]);

      for (let k = j; k < lastTx; k++) {
        let tx = block.txs[k];
        q.add(async () => {
          let processed = await this.provider.proceedTransaction(tx, block);

          if (!processed.length) return;

          let standard = processed.filter(tx => !tx.instant);
          let instant = processed.filter(tx => tx.instant);

          standard.length &&
            proccededBlock.txs.push({
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

      await q.onIdle();

      try {
        if (instantTxs.length) {
          this.confirm([
            {
              height: block.height,
              hash: block.hash,
              prev_hash: block.prev_hash,
              txs: instantTxs
            }
          ]);
        }
      } catch (e) {
        this.logger.error(e);
      }
    }

    return proccededBlock;
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
