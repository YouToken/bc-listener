'use strict';
const request = require('superagent');
const Cache = require('../../../utils/cache');

module.exports = class MoneroRest {
  constructor({url}) {
    this.url = url;
    this.cache = new Cache();
  }

  async cmd(command, ...args) {
    if (command === 'getHeight') {
      return request
        .get(`${this.url}/blocks/api/get_stats`)
        .then(response => JSON.parse(response.text))
        .then(response => response.height);
    }
    if (command === 'getblock') {
      return request
        .get(`${this.url}/blocks/api/get_block_data/${args[0]}`)
        .then(response => JSON.parse(response.text))
        .then(response => response.block_data.result);
    }
  }

  async getCurrentHeight() {
    return this.cache.getWithCache('getHeight', () => this.cmd('getHeight'), 60);
  }

  async getBlock(height) {
    let block = await this.cmd('getblock', height);
    return {
      height,
      hash: block.block_header.hash,
      prev_hash: block.block_header.prev_hash,
      txs: block.block_header.tx_hashes || []
    }
  }
}