'use strict';

const Provider = require('../provider');
const MoneroRest = require('./clients/rest');
const MoneroRPC = require('./clients/rpc');

module.exports = class XMR extends Provider {
  constructor(options) {
    super(options.currency || 'xmr');
    this.clientRest = new MoneroRest(options);
    this.clientRpc = new MoneroRPC(options);
  }

  async getBlock(height) {
    return await this.clientRest.getBlock(height);
  }

  async getHeight() {
    return await this.clientRest.getCurrentHeight();
  }

  async request({ method, params }) {
    return await this.clientRpc.request({ method, params });
  }

  async getPool() {
    return [];
  }
};
