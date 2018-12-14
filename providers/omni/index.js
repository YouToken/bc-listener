'use strict';

const rpcClient = require('./clients/rpc');
const {logger} = require('../../defaults');

module.exports = class Omni {
  constructor(conf) {
    this.currency = conf.currency ? conf.currency : 'omni';
    this.client = rpcClient(conf.url, conf.logger ? conf.logger : logger);
  }

  getCurrency() {
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
