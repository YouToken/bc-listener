'use strict';

const {JsonRpc} = require('eosjs');
const fetch = require('node-fetch');

module.exports = class EosRpc {

  constructor({url}) {
    this.rpc = new JsonRpc(url, {fetch});
  }

  async getCurrentHeight() {
    let info = await this.rpc.get_info();
    // return info.head_block_num;
    return info.last_irreversible_block_num;
  }

  async getBlock(height) {
    let block = await this.rpc.get_block(height);
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
