'use strict';

const request = require('superagent');

module.exports = (addr) => {
  return {
    timeLimit: {},

    async getAccount(account) {
      return this._execute('getAccount', 5, request.get, `${addr}/api/v1/account/${account}`)
        .then(response => response.body);
    },

    async getAccountSequence(account) {
      return this._execute('getAccountSequence', 5, request.get, `${addr}/api/v1/account/${account}/sequence`)
        .then(response => response.body.sequence);
    },

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
};
