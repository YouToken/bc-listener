'use strict';

const Provider = require('../provider');
const EthereumRpc = require('../eth/clients/rpc');

module.exports = class SGB extends Provider {

  constructor(options) {
    super(options.currency || 'sgb');
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
