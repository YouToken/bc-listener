'use strict';

const Provider = require('../provider');
const EthereumRpc = require('./clients/rpc');

module.exports = class ETH extends Provider {

  constructor(options) {
    super(options.currency || 'eth');
    this.client = new EthereumRpc(options);
  }

  async getBlock(height) {
    return this.client.getBlock(height);
  }

  async getHeight() {
    return this.client.getCurrentHeight();
  }

  async getPool() {
    return [];
  }
};
