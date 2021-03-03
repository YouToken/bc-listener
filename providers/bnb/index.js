'use strict';

const Provider = require('../provider');
const BinanceRpc = require('./clients/rpc');
const BinanceApi = require('./clients/api');

module.exports = class BNB extends Provider {

  constructor(options) {
    super(options.currency || 'bnb');
    this.client = new BinanceRpc(options);
    this.api = new BinanceApi({url: options.apiUrl});
    this.HOT = options.hot;
  }

  async getBlock(height) {
    let block = await this.client.getBlock(height);
    block.txs = block.txs.map(async tx => await this.api.getTransaction(tx.hash));
    return block;
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
    let result = {};
    let txs = await this.api.getAccountTransactions(this.HOT);
    for (let tx of txs) {
      if (tx.blockHeight < fromHeight) break;
      if (tx.blockHeight > toHeight) continue;
      if (!result[tx.blockHeight]) {
        result[tx.blockHeight] = [];
      }
      let txJSON = await this.api.getTransaction(tx.txHash);
      result[tx.blockHeight].push(txJSON);
    }
    return result;
  }

  async getHeight() {
    let status = await this.api.getStatus();
    return +status.sync_info.latest_block_height;
  }

  async getPool() {
    return [];
  }
};
