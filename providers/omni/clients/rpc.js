'use strict';

const BitcoinClient = require('bitcoin-core');
const urlParser = require('url');

module.exports = class OmniRpc {

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
    let height = await this.cmd('getblockcount');
    return +height - 1;
    // don't use omni_getinfo (it's very slow)
    // let info = await this.cmd('omni_getinfo');
    // return info.block;
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
