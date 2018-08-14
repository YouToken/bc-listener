'use strict';
const {logger} = require('../../../logging/logger');

module.exports = (currency='') => {
  return {
    async saveHeight(height) {logger.warn(`[${currency}] cannot save height, method is not specified`)},
    async loadHeight() {logger.warn(`[${currency}] cannot load height, method is not specified`); return 0},
    async saveUnconfirmed(block_hash, txs) {logger.warn(`[${currency}] cannot save unconfirmed, method is not specified`)},
    async clearUnconfirmed(block_hash) {logger.warn(`[${currency}] cannot clear unconfirmed, method is not specified`)},
    async saveTransactions(block_hash, txs) {logger.warn(`[${currency}] cannot save transactions, method is not specified`)},
    async clearTransactions(block_hash) {logger.warn(`[${currency}] cannot clear transactions, method is not specified`)}
  };
};