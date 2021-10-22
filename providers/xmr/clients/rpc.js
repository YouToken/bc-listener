'use strict';
const request = require('superagent');

module.exports = class MoneroRPC {
  constructor({wallet}) {
    this.walletUrl = wallet;
  }

  async request({method, params}) {
    try {
      const res = await request
        .post(`${this.walletUrl}/json_rpc`)
        .send({
          jsonrpc: "2.0",
          method,
          params,
          id: new Date().getTime()
        });
      return res.body.result;
    } catch (e) {
      console.error(e);
    }
  }

}