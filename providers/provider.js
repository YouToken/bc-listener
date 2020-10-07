'use strict';

module.exports = class Provider {

  constructor(currency) {
    this.currency = currency;
  }

  getCurrency() {
    return this.currency;
  }

  async getBlock(height) {
    throw new Error('Not implemented yet');
  }

  async getHeight() {
    throw new Error('Not implemented yet');
  }

  async getPool() {
    throw new Error('Not implemented yet');
  }

  async proceedTransaction(tx) {
    throw new Error('Not implemented yet');
  }
}