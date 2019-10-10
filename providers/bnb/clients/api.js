'use strict';

const request = require('superagent');

module.exports = (addr) => {
  return {
    async getAccount(account) {
      // TODO Rate Limit: 5 requests per IP per second.
      return request.get(`${addr}/api/v1/account/${account}`)
        .then(response => response.body);
    },

    async getAccountSequence(account) {
      // TODO Rate Limit: 5 requests per IP per second.
      return request.get(`${addr}/api/v1/account/${account}/sequence`)
        .then(response => response.body.sequence);
    }
  }
};
