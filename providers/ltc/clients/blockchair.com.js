'use strict';

const request = require('superagent');

module.exports = (conf = {}) => {
  const NETWORK = conf.network;

  return {
    async cmd(command, ...args) {
      if (command === 'getblockcount') {
        return await request
          .get(`https://api.blockchair.com/${NETWORK}/stats`)
          .then(response => response.body.data.blocks);
      }
    },
    async getCurrentHeight() {
      return this.cmd('getblockcount');
    }
  }
};
