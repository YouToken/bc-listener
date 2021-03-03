'use strict';

const sdk = require('@binance-chain/javascript-sdk');

module.exports = class BinanceRpc {

  constructor({url}) {
    this.rpc = new sdk.rpc(url);
  }

  async getCurrentHeight() {
    let status = await this.rpc.status();
    return +status.sync_info.latest_block_height;
  }

  async getBlock(height) {
    let block = await this.rpc.block({height});
    let blockHeader = block.block_meta.header;
    let transactions = await this.rpc.txSearch({query: `tx.height=${height}`});
    return {
      height: +blockHeader.height,
      hash: block.block_meta.block_id.hash,
      prev_hash: blockHeader.last_block_id.hash,
      timestamp: new Date(blockHeader.time),
      txs: transactions.txs
    }
  }
}
