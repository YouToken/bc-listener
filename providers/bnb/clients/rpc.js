'use strict';

const sdk = require('@binance-chain/javascript-sdk');

module.exports = (addr, logger) => {
  const rpc = new sdk.rpc(addr);

  return {
    rpc,

    async getCurrentHeight() {
      let status = await rpc.status();
      return status.sync_info.latest_block_height;
    },

    async getPool() {
      return [];
    },

    async getBlock(height) {
      let block = await rpc.block({height});
      let blockHeader = block.block_meta.header;
      let transactions = await rpc.txSearch({query: `tx.height=${height}`});
      return {
        height: blockHeader.height,
        hash: block.block_meta.block_id.hash,
        prev_hash: blockHeader.last_block_id.hash,
        timestamp: new Date(blockHeader.time),
        txs: transactions.txs
      }
    }
  }
};
