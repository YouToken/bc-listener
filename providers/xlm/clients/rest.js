'use strict';

const StellarSdk = require('stellar-sdk');

module.exports = (addr, logger) => {
  let server = new StellarSdk.Server(addr);

  return {
    async getCurrentHeight() {
      let ledger = await server
        .ledgers()
        .order('desc')
        .limit(1)
        .call();
      return ledger.records[0].sequence;
    },

    async getPool() {
      return [];
    },

    async getBlock(height) {
      let ledger = await server
        .ledgers()
        .ledger(height)
        .call();
      let xlmTxs = await ledger.transactions();
      let txs = [];
      for (let record of xlmTxs.records) {
        txs.push(record);
      }
      return {
        height: ledger.sequence,
        hash: ledger.hash,
        prev_hash: ledger.prev_hash,
        txs
      }
    }
  }
};
