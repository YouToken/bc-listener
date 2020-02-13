'use strict';

module.exports = (rpc, logger) => {
  return {
    rpc,

    async getCurrentHeight() {
      let info = await rpc.get_info();
      return info.head_block_num;
    },

    async getPool() {
      return []
    },

    async getBlock(height) {
      let block = await rpc.get_block(height);
      return {
        height: block.block_num,
        hash: block.id,
        prev_hash: block.previous,
        timestamp: new Date(block.timestamp),
        txs: block.transactions
          .filter(t => t.status === 'executed')
          .map(t => t.trx)
      }
    }
  }
};
