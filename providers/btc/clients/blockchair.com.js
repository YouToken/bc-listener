'use strict';

const request = require('superagent');
const BigNumber = require('bignumber.js');

module.exports = class BlockchairCom {

  constructor({network}) {
    this.NETWORK = network;
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
    return this.cmd('getblockcount');
  }

  async getBalance(address) {
    let balance = await this.cmd('getbalance', address);
    return new BigNumber(balance).div('100000000');
  }
}
