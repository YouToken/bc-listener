'use strict';

const rpcClient = require('./clients/rpc');

module.exports = class BTC {
  constructor(conf) {
    this.currency = conf.currency ? conf.currency : 'btc';
    this.client = rpcClient(conf.url);
  }

  async getCurrency() {
    return this.currency
  }

  async getBlock(height) {
    return this.client.getBlock(height)
  }

  async getHeight() {
    return this.client.getCurrentHeight()
  }

  async getPool() {
    return this.client.getPool()
  }

  async proceedTransaction(txid) {
    throw new Error('proceedTransaction method is not specified')
  }
};
