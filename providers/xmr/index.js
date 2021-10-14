'use strict';

const Provider = require('../provider');
const MoneroRest = require('./clients/rest');

module.exports = class XMR extends Provider {

  constructor(options) {
    super(options.currency || 'xmr');
    this.clientRest = new MoneroRest(options);
  }

  async getBlock(height) {
    return this.clientRest.getBlock(height);
  }

  async getHeight() {
    return this.clientRest.getCurrentHeight();
  }

  async getPool() {
    return [];
  }
};
