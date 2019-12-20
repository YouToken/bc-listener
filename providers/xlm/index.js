'use strict';

const restClient = require('./clients/rest');
const {logger} = require('../../defaults');

module.exports = class XLM {
  constructor(conf) {
    this.currency = conf.currency ? conf.currency : 'xlm';
    this.client = restClient(conf.url, conf.logger ? conf.logger : logger);
    this.HOT = conf.hot;
  }

  getCurrency() {
    return this.currency
  }

  async getBlock(height) {
    return this.client.getBlock(height)
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
    return this.client.getCurrentHeight()
  }

  async getPool() {
    return this.client.getPool()
  }

  async proceedTransaction(tx) {
    throw new Error('proceedTransaction method is not specified')
  }
};
