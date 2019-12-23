'use strict';

const rpcClient = require('./clients/rpc');
const apiClient = require('./clients/api');
const {logger} = require('../../defaults');

module.exports = class BNB {
  constructor(conf) {
    this.currency = conf.currency ? conf.currency : 'bnb';
    this.client = rpcClient(conf.url, conf.logger ? conf.logger : logger);
    this.api = apiClient(conf.apiUrl);
    this.HOT = conf.hot;
  }

  getCurrency() {
    return this.currency
  }

  async getBlock(height) {
    return this.client.getBlock(height)
  }

  async getBlockInfo(height) {
    let block = await this.client.rpc.block({height});
    let blockHeader = block.block_meta.header;
    return {
      height: +blockHeader.height,
      hash: block.block_meta.block_id.hash,
      prev_hash: blockHeader.last_block_id.hash,
      timestamp: new Date(blockHeader.time),
    }
  }

  async getHotAddressTransactions(fromHeight, toHeight) {
    let txs = await this.api.getAccountTransactions(this.HOT);

    let result = {};
    for (let tx of txs) {
      if (tx.blockHeight < fromHeight) break;
      if (tx.blockHeight > toHeight) continue;
      if (!result[tx.blockHeight]) {
        result[tx.blockHeight] = [];
      }
      result[tx.blockHeight].push(tx);
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
