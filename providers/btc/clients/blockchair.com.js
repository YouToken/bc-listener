'use strict';

const request = require('superagent');
const BigNumber = require('bignumber.js');

const Cache = require('../../../utils/cache');

module.exports = class BlockchairCom {

  constructor({network}) {
    this.NETWORK = network;
    this.cache = new Cache();
  }

  async cmd(command, ...args) {
    if (command === 'getblockcount') {
      return request
        .get(`https://api.blockchair.com/${this.NETWORK}/stats`)
        .then(response => response.body.data.blocks);
    }
    if (command === 'getbalance') {
      return request
        .get(`https://api.blockchair.com/${this.NETWORK}/addresses/balances?addresses=${args[0]}`)
        .then(response => {
          let balance = response.body.data[args[0]];
          return balance ? balance : 0;
        });
    }
  }

  async getCurrentHeight() {
    return this.cache.getWithCache('getblockcount', () => this.cmd('getblockcount'), 60);
  }

  async getBalance(address) {
    let balance = await this.cmd('getbalance', address);
    return new BigNumber(balance).div('100000000');
  }
}
