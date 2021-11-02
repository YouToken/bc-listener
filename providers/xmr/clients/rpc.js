'use strict';
const axios = require('axios');
const _ = require('lodash')

module.exports = class MoneroRPC {
  constructor({wallet}) {
    this.walletUrl = wallet;
  }

  async request({method, params}) {
    try {
      const res = await axios
        .post(`${this.walletUrl}/json_rpc`, JSON.stringify({
          jsonrpc: "2.0",
          method,
          params,
          id: new Date().getTime()
        }), {
          headers: {
            'Content-Type': 'application/json',
          },
        });

      return _.get(res, 'data.result');
    } catch (e) {
      console.error(e);
    }
  }

}