'use strict';

const request = require('superagent');
const BigNumber = require('bignumber.js');

module.exports = (conf = {}) => {
  const DOMAIN = conf.domain;

  return {
    async cmd(command, ...args) {
      if (command === 'getblockcount') {
        return await request
          .get(`https://${DOMAIN}/v3/block/latest`)
          .then(response => response.body.data.height);
      }
      if (command === 'getblock') {
        let block = await request
          .get(`https://${DOMAIN}/v3/block/${args[0]}`)
          .then(response => response.body.data);

        block.tx = [];
        let paging = true;
        while (paging) {
          let data = await request
            .get(`https://${DOMAIN}/v3/block/${args[0]}/tx?verbose=2`)
            .then(response => response.body.data);
          block.tx = block.tx.concat(data.list);
          paging = data.total_count > data.page * data.pagesize;
        }

        return block;
      }
      if (command === 'getbalance') {
        return await request
          .get(`https://${DOMAIN}/v3/address/${args[0]}`)
          .then(response => response.body.data);
      }
    },
    async getCurrentHeight() {
      return this.cmd('getblockcount');
    },
    async getBlock(height) {
      let block = await this.cmd('getblock', height);
      return {
        height: block.height,
        hash: block.hash,
        prev_hash: block.prev_block_hash,
        txs: block.tx
      }
    },
    async getBalance(address) {
      let balance = await this.cmd('getbalance', address);
      return new BigNumber(balance.balance).div('100000000');
    }
  }
};
