'use strict';

const BitcoinClient = require('bitcoin-core');
const urlParser = require('url');

module.exports = class BitcoinRpc {

  constructor({url}) {
    let urlObj = urlParser.parse(url);
    let [username, password] = urlObj.auth.split(':');
    this.client = new BitcoinClient({
      host: urlObj.hostname,
      port: urlObj.port,
      username,
      password
    });
  }

  async cmd(command, ...args) {
    return this.client.command(command, ...args);
  }

  async getCurrentHeight() {
    return this.cmd('getblockcount');
  }

  async getPool() {
    return this.cmd('getrawmempool');
  }

  async getBlock(height) {
    let hash = await this.cmd('getblockhash', height);
    let block = await this.cmd('getblock', hash, 1);  // 0 - hex data, 1 - json object, 2 for json object with transaction data
    if (block.tx) {
      block.tx = block.tx.map(txid => ({
        txid,
        blockhash: block.hash,
        confirmations: block.confirmations,
        time: block.time,
        blocktime: block.time
      }));
    }
    return {
      height: block.height,
      hash: block.hash,
      prev_hash: block.previousblockhash,
      timestamp: new Date(+block.time * 1000),
      txs: block.tx
    }
  }
}
