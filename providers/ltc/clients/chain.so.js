'use strict';

const request = require('superagent');

module.exports = class ChainSo {

  constructor({network}) {
    this.NETWORK = network;
  }

  async cmd(command, ...args) {
    if (command === 'getblockcount') {
      return request
        .get(`https://chain.so/api/v2/get_info/${this.NETWORK}`)
        .then(response => response.body.data.blocks);
    }
  }

  async getCurrentHeight() {
    return this.cmd('getblockcount');
  }
}
