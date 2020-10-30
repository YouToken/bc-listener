'use strict';

const Provider = require('../provider');
const RippleWs = require('./clients/ws');

module.exports = class XRP extends Provider {

  constructor(options) {
    super(options.currency || 'xrp');
    this.HOT = options.hot;
    this.client = new RippleWs().init(options);
  }

  async getBlock(height) {
    let block = await this.getBlockInfo(height);
    // TODO in fact we have only the one hot address
    let txs = await this.client.getTransactions(this.HOT, {
      minLedgerVersion: height,
      maxLedgerVersion: height
    });
    return {
      ...block,
      txs: txs ? txs : []
    }
  }

  async getBlockInfo(height) {
    let ledger = await this.client.getLedger({ledgerVersion: height});
    return {
      hash: ledger.ledgerHash,
      prev_hash: ledger.parentLedgerHash,
      height,
      timestamp: new Date(ledger.closeTime),
    }
  }

  async getHotAddressTransactions(fromHeight, toHeight) {
    let txs = await this.client.getTransactions(this.HOT, {
      minLedgerVersion: fromHeight,
      maxLedgerVersion: toHeight
    });

    let result = {};
    for (let tx of txs) {
      let outcome = tx.outcome;
      if (outcome.result !== 'tesSUCCESS' || tx.type !== 'payment') continue;
      if (!result[outcome.ledgerVersion]) {
        result[outcome.ledgerVersion] = [];
      }
      result[outcome.ledgerVersion].push(tx);
    }
    return result;
  }

  async getHeight() {
    let ledger = await this.client.getLedger();
    return ledger.ledgerVersion;
  }

  async getPool() {
    return [];
  }
}
