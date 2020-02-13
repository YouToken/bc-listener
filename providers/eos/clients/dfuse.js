const {createDfuseClient} = require("@dfuse/client");

global.fetch = require('node-fetch');
global.WebSocket = require('ws');

module.exports = (apiKey, network) => {
  let client = apiKey && apiKey.trim() !== "" && network && network.trim() !== ""
    ? createDfuseClient({apiKey, network})
    : null;

  return {
    client,

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
