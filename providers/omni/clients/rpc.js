'use strict';

const BitcoinClient = require('bitcoin-core');
const url = require('url');

module.exports = (addr, timeout = 30 * 1000, logger) => {
  let url_obj = url.parse(addr);
  let client = new BitcoinClient({
    host: url_obj.hostname,
    port: url_obj.port,
    username: url_obj.auth.split(':')[0],
    password: url_obj.auth.split(':')[1],
    timeout
  });
  return {
    async cmd(command, ...args) {
      return client.command(command, ...args);
    },

    async getCurrentHeight() {
      let info = await this.cmd('omni_getinfo');
      return info.block;
    },

    async getPool() {
      return this.cmd('omni_listpendingtransactions');
    },

    async getBlock(height) {
      let blockhash = await this.cmd('getblockhash', height);
      let block = await this.cmd('getblock', blockhash, true);
      let omniTxs = await this.cmd('omni_listblocktransactions', height);
      let txs = [];
      for (let txid of omniTxs) {
        txs.push({
          txid,
          blockhash,
          confirmations: block.confirmations, // TODO it's different for btc and omni
          time: block.time,
          blocktime: block.time
        });
      }
      return {
        height,
        hash: blockhash,
        prev_hash: block.previousblockhash,
        timestamp: new Date(+block.time * 1000),
        txs
      }
    }
  }
};
