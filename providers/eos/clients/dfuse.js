const {createDfuseClient} = require("@dfuse/client");

global.fetch = require('node-fetch');
global.WebSocket = require('ws');

module.exports = (apiKey, network) => {
  let client = createDfuseClient({apiKey, network});

  return {
    client,

    async getCurrentHeight() {
      let info = await client.apiRequest("/v1/chain/get_info", "POST");
      return info.head_block_num;
    },

    async getPool() {
      return []
    },

    async getBlock(height) {
      let block = await client.apiRequest("/v1/chain/get_block", "POST", {}, {"block_num_or_id": height});
      return {
        height: block.block_num,
        hash: block.id,
        prev_hash: block.previous,
        timestamp: new Date(block.timestamp),
        txs: block.transactions
          .filter(t => t.status === 'executed')
          .map(t => t.trx)
      }
    },

    async getAccountBlockHeights(account, lowBlockNum, highBlockNum) {
      let response = await client.graphql(`{
        searchTransactionsForward(query: "account:eosio.token action:transfer (data.from:${account} OR data.to:${account})", lowBlockNum: ${lowBlockNum}, highBlockNum: ${highBlockNum}) {
          results {
            trace {
              block {
                num
              }
            }
          }
        }
      }`);
      let results = response.data.searchTransactionsForward.results || [];
      return results.map(result => result.trace.block.num);
    }
  }
};
