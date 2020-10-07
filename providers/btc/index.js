'use strict';

const Provider = require('../provider');
const BitcoinRpc = require('./clients/rpc');

module.exports = class BTC extends Provider {

  constructor(options) {
    super(options.currency || 'btc');
    this.client = new BitcoinRpc(options);
  }

  async getBlock(height) {
    return this.client.getBlock(height);
  }

  async getHeight() {
    return this.client.getCurrentHeight();
  }

  async getPool() {
    return this.client.getPool();
  }
};
