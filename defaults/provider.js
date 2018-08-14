'use strict';

module.exports = (currency='') => {
  return {
    getCurrency() {return currency},
    async getBlock(height) {throw new Error(`[${currency}] getBlock method is not specified`)},
    async getHeight() {throw new Error(`[${currency}] getHeight method is not specified`)},
    async getPool() {throw new Error(`[${currency}] getPool method is not specified`)},
    async proceedTransaction(tx) {throw new Error(`[${currency}] proceedTransaction method is not specified`)}
  }
};