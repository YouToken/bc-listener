'use strict';

const {JsonRpc} = require('eosjs');
const fetch = require('node-fetch');

module.exports = (addr, logger) => {
  const rpc = new JsonRpc(addr, {fetch});

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
        txs: block.transactions
          .filter(t => t.status === 'executed')
          .map(t => t.trx)
      }
    }
  }
};
