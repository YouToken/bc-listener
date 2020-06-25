'use strict';

const request = require('superagent');
const BigNumber = require('bignumber.js');

module.exports = (conf = {}) => {
  const NETWORK = conf.network;

  return {
    async cmd(command, ...args) {
      if (command === 'getblockcount') {
        return await request
          .get(`https://api.blockchair.com/${NETWORK}/stats`)
          .then(response => response.body.data.blocks);
      }
      if (command === 'getbalance') {
        return await request
          .get(`https://api.blockchair.com/${NETWORK}/addresses/balances?addresses=${args[0]}`)
          .then(response => response.body.data[args[0]]);
      }
    },

    async getCurrentHeight() {
      return this.cmd('getblockcount');
    },

    async getBalance(address) {
      let balance = await this.cmd('getbalance', address);
      return new BigNumber(balance).div('100000000');
    }
  }
};
