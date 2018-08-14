'use strict';

const request = require('superagent');
const BigNumber = require('bignumber.js');

module.exports = (conf = {}) => {
  const DOMAIN = conf.domain;

  return {
    async cmd(command, ...args) {
      if (command === 'getblockcount') {
        return await request
          .get(`https://${DOMAIN}/latestblock`)
          .then(response => response.body.height);

      }
      if (command === 'getblock') {
        return await request
          .get(`https://${DOMAIN}/block-height/${args[0]}`)
          .query({format: 'json'})
          .then(response => response.body.blocks)
          .then(blocks => blocks.filter(block => block.main_chain))
          .then(blocks => blocks[0]);
      }
      if (command === 'getbalance') {
        return await request
          .get(`https://${DOMAIN}/balance?active=${args[0]}`)
          .then(response => response.body[args[0]]);
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
        prev_hash: block.prev_block,
        txs: block.tx
      }
    },
    async getBalance(address) {
      let balance = await this.cmd('getbalance', address);
      return new BigNumber(balance.final_balance).div('100000000');
    }
  }
};
