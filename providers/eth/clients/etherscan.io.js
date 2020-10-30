'use strict';

const request = require('superagent');
const BigNumber = require('bignumber.js');

module.exports = class EtherscanIo {

  constructor({domain, apiKey}) {
    this.API_KEY = apiKey;
    this.DOMAIN = domain;
  }

  async cmd(command, ...args) {
    if (command === 'eth_blockNumber') {
      return request
        .get(`https://${this.DOMAIN}/api`)
        .query({
          module: 'proxy',
          action: 'eth_blockNumber',
          apikey: this.API_KEY
        })
        .then(response => response.body.result);
    }
    if (command === 'eth_getBlockByNumber') {
      let data = await request
        .get(`https://${this.DOMAIN}/api`)
        .query({
          module: 'proxy',
          action: 'eth_getBlockByNumber',
          tag: args[0].toString(16),
          boolean: true,
          apikey: this.API_KEY
        })
        .then(response => response.body.result);
      for (let i = 0; i < data.transactions.length; i++) {
        let receipt = await this.cmd('eth_getTransactionReceipt', data.transactions[i].hash);
        Object.assign(receipt, {
          gasUsed: (new BigNumber(receipt.gasUsed, 16)).toString(10),
          cumulativeGasUsed: (new BigNumber(receipt.cumulativeGasUsed, 16)).toString(10),
        });
        Object.assign(data.transactions[i], {
          receipt,
          gas: (new BigNumber(data.transactions[i].gas, 16)).toString(10),
          gasPrice: (new BigNumber(data.transactions[i].gasPrice, 16)).toString(10),
          nonce: (new BigNumber(data.transactions[i].nonce, 16)).toString(10),
          transactionIndex: (new BigNumber(data.transactions[i].transactionIndex, 16)).toString(10),
          value: (new BigNumber(data.transactions[i].value, 16)).toString(10)
        }, {timestamp: data.timestamp});
      }
      return data;
    }
    if (command === 'eth_getTransactionReceipt') {
      return request
        .get(`https://${this.DOMAIN}/api`)
        .query({
          module: 'proxy',
          action: 'eth_getTransactionReceipt',
          txhash: args[0],
          apikey: this.API_KEY
        })
        .then(response => response.body.result);
    }
  }

  async getCurrentHeight() {
    return +(await this.cmd('eth_blockNumber'));
  }

  async getBlock(height) {
    let data = await this.cmd('eth_getBlockByNumber', height);
    return {
      hash: data.hash,
      prev_hash: data.parentHash,
      height,
      txs: data.transactions
    }
  }
}
