'use strict';

const request = require('superagent');
const moment = require('moment');

module.exports = (conf = {}) => {
  const DOMAIN = conf.domain;

  return {
    async cmd(command, ...args) {
      if (command === 'getblockcount') {
        return await request
          .get(`https://${DOMAIN}/insight-api/blocks?limit=1&blockDate=${moment().format('YYYY-MM-DD')}`)
          .then(response => response.body.blocks)
          .then(blocks => blocks[0].height);
      }
      if (command === 'getblock') {
        let blockHash = await this.cmd('getblockhash', args[0]);
        return await request
          .get(`https://${DOMAIN}/insight-api/block/${blockHash}`)
          .then(response => response.body);
      }
      if (command === 'getblockhash') {
        return await request
          .get(`https://${DOMAIN}/insight-api/block-index/${args[0]}`)
          .then(response => response.body.blockHash);
      }
    },
    async getCurrentHeight() {
      return this.cmd('getblockcount');
    },
    async getBlock(height) {
      let block = await this.cmd('getblock', height);
      return {
        height: block.height,
        hash: block.hash,
        prev_hash: block.previousblockhash,
        txs: block.tx
      }
    }
  }
};
