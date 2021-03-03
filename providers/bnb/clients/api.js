'use strict';

const request = require('superagent');

module.exports = class BinanceApi {

  constructor({url}) {
    this.URL = url;
    this.timeLimit = {};
  }

  async getStatus() {
    return this._execute('getStatus', 1, request.get, `${this.URL}/api/v1/node-info`)
      .then(response => response.body);
  }

  async getAccount(account) {
    return this._execute('getAccount', 5, request.get, `${this.URL}/api/v1/account/${account}`)
      .then(response => response.body);
  }

  async getAccountSequence(account) {
    return this._execute('getAccountSequence', 5, request.get, `${this.URL}/api/v1/account/${account}/sequence`)
      .then(response => response.body.sequence);
  }

  async getAccountTransactions(account) {
    return this._execute('getAccountTransactions', 1, request.get, `${this.URL}/api/v1/transactions?address=${account}&txAsset=BNB&txType=TRANSFER`)
      .then(response => response.body.tx);
  }

  async getTransaction(hash) {
    return this._execute('getTransaction', 10, request.get, `${this.URL}/api/v1/tx/${hash}?format=json`)
      .then(response => response.body);
  }

  async _execute(key, rateLimit, fn, ...args) {
    return new Promise((resolve, reject) => {
      let now = new Date().getTime();
      this.timeLimit[key] = this.timeLimit[key] || now;
      let timeout = 0;
      if (this.timeLimit[key] > now) {
        timeout = this.timeLimit[key] - now;
        this.timeLimit[key] += rateLimit * 1000;
      } else {
        this.timeLimit[key] = now + rateLimit * 1000;
      }
      setTimeout(() => {
        fn(...args)
          .then(data => {
            resolve(data);
          })
          .catch(e => {
            reject(e);
          });
      }, timeout);
    });
  }
}
