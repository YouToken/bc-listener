'use strict';

const rpcClient = require('./clients/rpc');
const {logger} = require('../../../defaults');

module.exports = class ETH {
  constructor(conf) {
    this.currency = conf.currency ? conf.currency : 'eth';
    this.client = rpcClient(conf.url, conf.logger ? conf.logger : logger);
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
    return []
  }

  async proceedTransaction(tx) {
    throw new Error('proceedTransaction method is not specified')
  }
};
