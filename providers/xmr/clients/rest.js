'use strict';

const axios = require('axios');
const Cache = require('../../../utils/cache');
const { REST_COMMAND_GET_BLOCK, REST_COMMAND_GET_HEIGHT } = require('./cmd');

module.exports = class MoneroRest {
  constructor({ url }) {
    this.url = url;
    this.cache = new Cache();
  }

  async cmd(command, ...args) {
    if (command === REST_COMMAND_GET_HEIGHT) {
      const { data } = await axios.get(`${this.url}/blocks/api/get_stats`);

      return data.height;
    }
    if (command === REST_COMMAND_GET_BLOCK) {
      const { data } = await axios.get(
        `${this.url}/blocks/api/get_block_data/${args[0]}`,
      );

      return data.block_data.result;
    }
  }

  async getCurrentHeight() {
    return this.cache.getWithCache(
      REST_COMMAND_GET_HEIGHT,
      () => this.cmd(REST_COMMAND_GET_HEIGHT),
      60,
    );
  }

  async getBlock(height) {
    const block = await this.cmd(REST_COMMAND_GET_BLOCK, height);
    return {
      height,
      hash: block.block_header.hash,
      prev_hash: block.block_header.prev_hash,
      txs: block.block_header.tx_hashes || [],
    };
  }
};
