const {JsonRpc} = require('eosjs');

module.exports = class DfuseJsonRpc extends JsonRpc {

  constructor(client) {
    super("");
    this.client = client;
  }

  // override default method
  async fetch(path, body) {
    return this.client.apiRequest(path, "POST", {}, body);
  }
};