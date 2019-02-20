'use strict';

const restClient = require('./clients/rest');
const {logger} = require('../../defaults');

module.exports = class XLM {
  constructor(conf) {
    this.currency = conf.currency ? conf.currency : 'xlm';
    this.client = restClient(conf.url, conf.logger ? conf.logger : logger);
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

  async proceedTransaction(tx) {
    throw new Error('proceedTransaction method is not specified')
  }
};
