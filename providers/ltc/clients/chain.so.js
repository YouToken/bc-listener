'use strict';

const request = require('superagent');

module.exports = (conf = {}) => {
  const NETWORK = conf.network;

  return {
    async cmd(command, ...args) {
      if (command === 'getblockcount') {
        return await request
          .get(`https://chain.so/api/v2/get_info/${NETWORK}`)
          .then(response => response.body.data.blocks);
      }
    },
    async getCurrentHeight() {
      return this.cmd('getblockcount');
    }
  }
};
