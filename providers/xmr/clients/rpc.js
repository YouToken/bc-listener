'use strict';

const axios = require('axios');

module.exports = class MoneroRPC {
  constructor({ wallet }) {
    this.walletUrl = wallet;
  }

  async request({ method, params }) {
    try {
      const { data } = await axios.post(`${this.walletUrl}/json_rpc`, {
        jsonrpc: '2.0',
        method,
        params,
        id: new Date().getTime(),
      });

      return data.result;
    } catch (e) {
      return null;
    }
  }
};
