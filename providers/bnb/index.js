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
    return this.client.getBlock(height);
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
      let txInRpcFormat = await this.client.rpc.tx({hash: Buffer.from(tx.txHash, 'hex')});
      result[tx.blockHeight].push(txInRpcFormat);
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
