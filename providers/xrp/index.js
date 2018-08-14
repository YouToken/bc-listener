'use strict';

const wssClient = require('./clients/wss');
const {logger} = require('../../../defaults');

module.exports = class XRP {
  constructor(conf) {
    this.currency = conf.currency ? conf.currency : 'xrp';
    this.client = wssClient(conf.url, conf.logger ? conf.logger : logger);
    this.HOT = conf.hot;
  }

  async getCurrency() {
    return this.currency
  }

  async getBlock(height) {
    try {
      let ledger = await this.client.getLedger({ledgerVersion: height});
      // TODO in fact we have only the one hot address
      let txs = await this.client.getTransactions(this.HOT, {
        minLedgerVersion: height,
        maxLedgerVersion: height
      });
      return {
        hash: ledger.ledgerHash,
        prev_hash: ledger.parentLedgerHash,
        height,
        txs: txs ? txs : []
      }
    } catch (e) {
      return {
        hash: null,
        prev_hash: null,
        height,
        txs: []
      }
    }
  }

  async getHeight() {
    let ledger = await this.client.getLedger();
    return ledger.ledgerVersion;
  }

  async getPool() {
    return []
  }

  async proceedTransaction(tx) {
    throw new Error('proceedTransaction method is not specified')
  }
};
