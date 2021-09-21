'use strict';

const Provider = require('../provider');
const MoneroRest = require('./clients/rest');

module.exports = class XMR extends Provider {

  constructor(options) {
    super(options.currency || 'xmr');
    this.client = new MoneroRest(options);
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
