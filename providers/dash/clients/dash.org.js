'use strict';

const request = require('superagent');

module.exports = (conf = {}) => {
  const NETWORK = conf.network;

  return {
    async cmd(command, ...args) {
      if (command === 'getblockcount') {
        return await request
          .get(`https://explorer.dash.org/chain/${NETWORK}/q/getblockcount`)
          .then(response => +response.text);
      }
    },
    async getCurrentHeight() {
      return this.cmd('getblockcount');
    }
  }
};
