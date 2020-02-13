'use strict';

const rpcClient = require('./clients/rpc');
const dfuseClient = require('./clients/dfuse');
const {logger} = require('../../defaults');

module.exports = class EOS {
  constructor(conf) {
    this.currency = conf.currency ? conf.currency : 'eos';
    this.client = rpcClient(conf.url, conf.logger ? conf.logger : logger);
    this.dfuse = dfuseClient(conf.dfuseApiKey, conf.dfuseNetwork);
    this.HOT = conf.hot;
  }

  getCurrency() {
    return this.currency
  }

  async getBlock(height) {
    return this.dfuse.getBlock(height)
  }

  async getBlockInfo(height) {
    let block = await this.dfuse.client.apiRequest("/v1/chain/get_block", "POST", {}, {"block_num_or_id": height});
    return {
      height: block.block_num,
      hash: block.id,
      prev_hash: block.previous,
      timestamp: new Date(block.timestamp),
    };
  }

  async getHotAddressTransactions(fromHeight, toHeight) {
    let result = {};
    let blockHeights = await this.dfuse.getAccountBlockHeights(this.HOT, fromHeight, toHeight);
    for (let blockHeight of blockHeights) {
      let block = await this.getBlock(blockHeight);
      result[blockHeight] = block.txs;
    }
    return result;
  }

  async getHeight() {
    return this.dfuse.getCurrentHeight()
  }

  async getPool() {
    return this.dfuse.getPool()
  }

  async proceedTransaction(tx) {
    throw new Error('proceedTransaction method is not specified')
  }
};
