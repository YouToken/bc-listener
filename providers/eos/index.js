'use strict';

const Provider = require('../provider');
const GreymassApi = require('./clients/greymass');
const EosRpc = require('./clients/rpc');

module.exports = class EOS extends Provider {

  constructor(options) {
    super(options.currency || 'eos');
    this.HOT = options.hot;
    this.client = new EosRpc(options);
    this.greymass = new GreymassApi();
  }

  async getBlock(height) {
    return this.client.getBlock(height);
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
    let blockHeights = await this.greymass.getAccountBlockHeights(this.HOT, fromHeight, toHeight);
    for (let blockHeight of blockHeights) {
      let block = await this.getBlock(blockHeight);
      result[blockHeight] = block.txs;
    }
    return result;
  }

  async getHeight() {
    return this.client.getCurrentHeight();
  }

  async getPool() {
    return [];
  }
};
