'use strict';

const StellarSdk = require('stellar-sdk');

module.exports = class StellarApi {

  constructor({url}) {
    this.api = new StellarSdk.Server(url, {allowHttp: true});
  }

  async getCurrentHeight() {
    let ledger = await this.api
      .ledgers()
      .order('desc')
      .limit(1)
      .call();
    return ledger.records[0].sequence;
  }

  async getBlock(height) {
    let ledger = await this.api
      .ledgers()
      .ledger(height)
      .call();
    let txs = [];
    let page = await ledger.transactions();
    while (page.records && page.records.length) {
      for (let tx of page.records) {
        txs.push(tx);
      }
      page = await page.next();
    }
    return {
      height: ledger.sequence,
      hash: ledger.hash,
      prev_hash: ledger.prev_hash,
      timestamp: new Date(ledger.closed_at),
      txs
    }
  }
}
