'use strict';

const request = require('superagent');

module.exports = class BinanceRpc {

  constructor({url}) {
    this.URL = url;
  }

  async getCurrentHeight() {
    let status = await this.call("status");
    return +status.sync_info.latest_block_height;
  }

  async getBlock(height) {
    let block = await this.call("block", {height});
    let blockHeader = block.block_meta.header;
    let transactions = await this.call("tx_search", {query: `tx.height=${height}`});
    return {
      height: +blockHeader.height,
      hash: block.block_meta.block_id.hash,
      prev_hash: blockHeader.last_block_id.hash,
      timestamp: new Date(blockHeader.time),
      txs: transactions.txs
    }
  }

  call(method, args = {}) {
    return request.get(`${this.URL}/${method}?${this._buildUrlArgs(args)}`)
      .then(response => {
        let body = response.body;
        if (body.error) {
          throw new Error(body.error.message);
        }
        return body.result;
      });
  }

  _buildUrlArgs(args) {
    let search = [];
    for (let key of Object.keys(args)) {
      let value = args[key];
      if (typeof value === 'string') {
        search.push(`${key}=\"${value}\"`);
      } else if (Buffer.isBuffer(value)) {
        search.push(`${key}=0x${value.toString("hex")}`);
      } else {
        search.push(`${key}=${value}`);
      }
    }
    return search.join("&");
  }
}
