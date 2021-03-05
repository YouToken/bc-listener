'use strict';

const request = require('superagent');

const RateLimitExecutor = require('../../../utils/rateLimitExecutor');

module.exports = class BinanceApi {

  constructor({url}) {
    this.URL = url;
    this.executor = new RateLimitExecutor();
  }

  async getStatus() {
    return this.executor.execute('getStatus', 1, () => request.get(`${this.URL}/api/v1/node-info`))
      .then(response => response.body);
  }

  async getAccount(account) {
    return this.executor.execute('getAccount', 5, () => request.get(`${this.URL}/api/v1/account/${account}`))
      .then(response => response.body);
  }

  async getAccountSequence(account) {
    return this.executor.execute('getAccountSequence', 5, () => request.get(`${this.URL}/api/v1/account/${account}/sequence`))
      .then(response => response.body.sequence);
  }

  async getAccountTransactions(account) {
    return this.executor.execute('getAccountTransactions', 1, () => request.get(`${this.URL}/api/v1/transactions?address=${account}&txAsset=BNB&txType=TRANSFER`))
      .then(response => response.body.tx);
  }

  async getTransaction(hash) {
    return this.executor.execute('getTransaction', 10, () => request.get(`${this.URL}/api/v1/tx/${hash}?format=json`))
      .then(response => response.body);
  }
}
