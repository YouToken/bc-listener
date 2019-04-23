'use strict';

const {JsonRpc} = require('eosjs');
const fetch = require('node-fetch');

module.exports = (addr, logger) => {
  const rpc = new JsonRpc(addr, {fetch});

  return {
    async cmd(command, ...args) {
      return new Promise((resolve, reject) => rpc[command](...args, (err, result) => err ? reject(err) : resolve(result)));
    },

    async getCurrentHeight() {
      let info = await rpc.get_info();
      return info.last_irreversible_block_num;
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
