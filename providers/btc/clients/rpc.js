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
      return this.cmd('getblockcount');
    },

    async fetchInputs(txid) {
      let h;
      try {
        h = await this.cmd('getrawtransaction', txid);
      } catch (e) {
        logger.error({message: `Failed fetching ${txid}`, error: e});
        return [];
      }
      let {vin} = await this.cmd('decoderawtransaction', h);
      let result = [];
      for (let i = 0; i < vin.length; i++) {
        if (vin[i].coinbase) continue;
        let hex;
        try {
          hex = await this.cmd('getrawtransaction', vin[i].txid);
        } catch (e) {
          logger.error({message: `Failed fetching hex ${vin[i].txid}`, error: e});
          continue;
        }
        let tx = await this.cmd('decoderawtransaction', hex);
        let out = tx.vout[vin[i].vout];
        result.push({
          addr: out.scriptPubKey.addresses ? out.scriptPubKey.addresses[0] : null,
          value: out.value
        });
      }
      return result;
    },

    async getPool() {
      return await this.cmd('getrawmempool');
    },

    async getBlock(height) {
      let hash = await this.cmd('getblockhash', height);
      let block = await this.cmd('getblock', hash, 1);  // 0 for hex-encoded data, 1 for a json object, and 2 for json object with transaction data
      if (block.tx) {
        let txs = [];
        block.tx.forEach(async (txid) => {
          txs.push({
            txid,
            blockhash: block.hash,
            confirmations: block.confirmations,
            time: block.time,
            blocktime: block.time
          });
        });
        block.tx = txs;
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
};
