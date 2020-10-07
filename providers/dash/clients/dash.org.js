'use strict';

const request = require('superagent');

module.exports = class DashOrg {

  constructor({network}) {
    this.NETWORK = network;
  }

  async cmd(command, ...args) {
    if (command === 'getblockcount') {
      return request
        .get(`https://explorer.dash.org/chain/${this.NETWORK}/q/getblockcount`)
        .then(response => +response.text);
    }
  }

  async getCurrentHeight() {
    return this.cmd('getblockcount');
  }
}
