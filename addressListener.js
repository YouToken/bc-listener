"use strict";

const Listener = require("./index");
const _ = require("lodash");

class AddressListener extends Listener {

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

    let blockTxs = await this.provider.getHotAddressTransactions(fromBlock, toBlock);
    for (let height of Object.keys(blockTxs).sort()) {
      try {
        let block = await this.provider.getBlockInfo(height);
        await this.confirm([{
          height,
          hash: block.hash,
          prev_hash: block.prev_hash,
          txs: blockTxs[height]
        }]);
      } catch (e) {
        this.logger.error(e);
      }
    }

    if (update_height) {
      await this.storage.saveHeight(toBlock + 1);
      this.emit("save_height", toBlock + 1);
    }

    this.log("debug", "worker finished");
  }
}

module.exports = AddressListener;
