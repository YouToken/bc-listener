'use strict';

const Provider = require('../provider');
const OmniRpc = require('./clients/rpc');

module.exports = class Omni extends Provider {

  constructor(options) {
    super(options.currency || 'omni');
    this.client = new OmniRpc(options);
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
}
