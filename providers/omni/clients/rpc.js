'use strict';

const BitcoinClient = require('bitcoin-core');
const urlParser = require('url');

let cache = {};

async function getWithCache(key, promise, lifetime = 60) {
  let item = cache[key];
  if (!item || new Date().getTime() > item.expireAt) {
    cache[key] = {
      data: promise()
        .then(result => result)
        .catch(e => {
          delete cache[key];
          throw e;
        }),
      expireAt: new Date().getTime() + lifetime * 1000
    }
  }
  return cache[key].data;
}

module.exports = class OmniRpc {

  constructor({url}) {
    let urlObj = urlParser.parse(url);
    let [username, password] = urlObj.auth.split(':');
    this.client = new BitcoinClient({
      host: urlObj.hostname,
      port: urlObj.port,
      username,
      password,
      timeout: 60000
    });
  }

  async cmd(command, ...args) {
    return this.client.command(command, ...args);
  }

  async getCurrentHeight() {
    // omni_getinfo is very slow, so use cache for it
    let info = await getWithCache('omni_getinfo', () => this.cmd('omni_getinfo'), 300);
    return info.block;
  }

  async getPool() {
    return this.cmd('omni_listpendingtransactions');
  }

  async getBlock(height) {
    let blockhash = await this.cmd('getblockhash', height);
    let block = await this.cmd('getblock', blockhash, true);
    let omniTxs = await this.cmd('omni_listblocktransactions', height);
    return {
      height,
      hash: blockhash,
      prev_hash: block.previousblockhash,
      timestamp: new Date(+block.time * 1000),
      txs: omniTxs.map(txid => ({
        txid,
        blockhash,
        confirmations: block.confirmations, // TODO it's different for btc and omni
        time: block.time,
        blocktime: block.time
      }))
    }
  }
}
