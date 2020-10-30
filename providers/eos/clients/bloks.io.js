'use strict';

const request = require('superagent');

module.exports = class BloksIo {

  async cmd(command, ...args) {
    if (command === 'getblockcount') {
      return request
        .get('https://www.api.bloks.io/info/get')
        .then(response => response.body.head_block_num);
    }
  }

  async getCurrentHeight() {
    return this.cmd('getblockcount');
  }
}
