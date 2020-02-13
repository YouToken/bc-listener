'use strict';

const {JsonRpc} = require('eosjs');
const fetch = require('node-fetch');
const DfuseJsonRpc = require('./clients/dfuse-jsonrpc');
const dfuseClient = require('./clients/dfuse');
const rpcClient = require('./clients/rpc');
const {logger} = require('../../defaults');

module.exports = class EOS {
  constructor(conf) {
    this.currency = conf.currency ? conf.currency : 'eos';
    this.dfuse = dfuseClient(conf.dfuseApiKey, conf.dfuseNetwork);
    let jsonRpc = this.dfuse.client
      ? new DfuseJsonRpc(this.dfuse.client)
      : new JsonRpc(conf.url, {fetch});
    this.client = rpcClient(jsonRpc, conf.logger ? conf.logger : logger);
    this.HOT = conf.hot;
  }

  getCurrency() {
    return this.currency
  }

  async getBlock(height) {
    return this.client.getBlock(height)
  }

  async getBlockInfo(height) {
    let block = await this.client.rpc.get_block(height);
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
    return this.client.getCurrentHeight()
  }

  async getPool() {
    return this.client.getPool()
  }

  async proceedTransaction(tx) {
    throw new Error('proceedTransaction method is not specified')
  }
};
