'use strict';

const Provider = require('../provider');
const StellarApi = require('./clients/rest');

module.exports = class XLM extends Provider {

  constructor(options) {
    super(options.currency || 'xlm');
    this.HOT = options.hot;
    this.client = new StellarApi(options);
  }

  async getBlock(height) {
    return this.client.getBlock(height);
  }

  async getBlockInfo(height) {
    let ledger = await this.client.api
      .ledgers()
      .ledger(height)
      .call();
    return {
      height: ledger.sequence,
      hash: ledger.hash,
      prev_hash: ledger.prev_hash,
      timestamp: new Date(ledger.closed_at),
    }
  }

  async getHotAddressTransactions(fromHeight, toHeight) {
    let pageSize = toHeight - fromHeight;
    let page = await this.client.api.transactions()
      .forAccount(this.HOT)
      .order('desc')
      .limit(pageSize)
      .call();

    let result = {};
    outer:
      while (page.records && page.records.length) {
        for (let tx of page.records) {
          let ledger = await tx.ledger();
          if (ledger.sequence < fromHeight) break outer;
          if (ledger.sequence > toHeight) continue;
          if (!result[ledger.sequence]) {
            result[ledger.sequence] = [];
          }
          result[ledger.sequence].push(tx);
        }
        if (page.records.length < pageSize) break;
        page = await page.next();
      }
    return result;
  }

  async getHeight() {
    return this.client.getCurrentHeight();
  }

  async getPool() {
    return [];
  }
}
