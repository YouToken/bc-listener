const superagent = require("superagent");

const GREYMASS_URL = "https://eos.greymass.com";

module.exports = () => {

  return {

    async getAccountBlockHeights(account, lowBlockNum, highBlockNum) {
      let actions = await superagent
        .post(`${GREYMASS_URL}/v1/history/get_actions`)
        .send({account_name: "youhodlereos", pos: -1, offset: -10})
        .then(response => response.body.actions);

      return actions
        .filter(item => item.block_num >= lowBlockNum && item.block_num <= highBlockNum)
        .map(item => item.block_num);
    }
  }
};
