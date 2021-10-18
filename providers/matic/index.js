'use strict';

const Provider = require('../provider');
const EthereumRpc = require('../eth/clients/rpc');

module.exports = class Matic extends Provider {

  constructor(options) {
    super(options.currency || 'matic');
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
