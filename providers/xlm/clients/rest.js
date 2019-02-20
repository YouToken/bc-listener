'use strict';

const StellarSdk = require('stellar-sdk');

module.exports = (addr, logger) => {
  let api = new StellarSdk.Server(addr);

  return {
    api,

    async getCurrentHeight() {
      let ledger = await api
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
      let ledger = await api
        .ledgers()
        .ledger(height)
        .call();
      let xlmTxs = await ledger.transactions();
      let txs = [];
      for (let tx of xlmTxs.records) {
        txs.push(tx);
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
