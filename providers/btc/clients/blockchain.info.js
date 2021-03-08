'use strict';

const request = require('superagent');
const BigNumber = require('bignumber.js');

const Cache = require('../../../utils/cache');

module.exports = class BlockchainInfo {

  constructor({domain}) {
    this.DOMAIN = domain;
    this.cache = new Cache();
  }

  async cmd(command, ...args) {
    if (command === 'getblockcount') {
      return request
        .get(`https://${this.DOMAIN}/latestblock`)
        .then(response => response.body.height);
    }
    if (command === 'getblock') {
      return request
        .get(`https://${this.DOMAIN}/block-height/${args[0]}`)
        .query({format: 'json'})
        .then(response => response.body.blocks)
        .then(blocks => blocks.filter(block => block.main_chain))
        .then(blocks => blocks[0]);
    }
    if (command === 'getbalance') {
      return request
        .get(`https://${this.DOMAIN}/balance?active=${args[0]}`)
        .then(response => response.body[args[0]]);
    }
  }

  async getCurrentHeight() {
    return this.cache.getWithCache('getblockcount', () => this.cmd('getblockcount'), 60);
  }

  async getBlock(height) {
    let block = await this.cmd('getblock', height);
    return {
      height: block.height,
      hash: block.hash,
      prev_hash: block.prev_block,
      txs: block.tx
    }
  }

  async getBalance(address) {
    let balance = await this.cmd('getbalance', address);
    return new BigNumber(balance.final_balance).div('100000000');
  }
}
