const {createDfuseClient} = require("@dfuse/client");

global.fetch = require('node-fetch');
global.WebSocket = require('ws');

module.exports = (apiKey, network) => {
  return {
    client: createDfuseClient({apiKey, network}),

    async getAccountBlockHeights(account, lowBlockNum, highBlockNum) {
      let response = await this.client.graphql(`{
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
