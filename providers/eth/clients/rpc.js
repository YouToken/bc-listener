'use strict';

const Web3 = require('web3');
const formatter = require('web3-core-helpers').formatters;
const web3Utils = require('web3-utils');
const util = require('util');
const BigNumber = require('bignumber.js');

const traceTransactionFormatter = function (tx) {
  if (tx.action) {
    tx.action.gas = tx.action.gas ? formatter.outputBigNumberFormatter(tx.action.gas) : '0';
    tx.action.value = tx.action.value ? formatter.outputBigNumberFormatter(tx.action.value) : '0';

    if (tx.action.to && web3Utils.isAddress(tx.action.to)) { // tx.to could be `0x0` or `null` while contract creation
      tx.action.to = web3Utils.toChecksumAddress(tx.action.to);
    } else {
      tx.action.to = null; // set to `null` if invalid address
    }

    if (tx.action.from) {
      tx.action.from = web3Utils.toChecksumAddress(tx.action.from);
    }
  }

  if (tx.result) {
    tx.result.gasUsed = tx.result.gasUsed ? formatter.outputBigNumberFormatter(tx.result.gasUsed) : '0';
  }

  return tx;
};

module.exports = (addr, logger) => {
  let web3 = new Web3(new Web3.providers.HttpProvider(addr));
  web3.extend({
    property: 'trace',
    methods: [{
      name: 'traceTransaction',
      call: 'trace_transaction',
      params: 1,
      inputFormatter: [null],
      outputFormatter: traceTransactionFormatter
    }]
  });

  let eth = new Proxy(web3.eth, {
    get(target, property) {
      if (util.isFunction(target[property])) {
        return function (...args) {
          return new Promise((resolve, reject) => target[property](...args, (err, result) => err ? reject(err) : resolve(result)));
        }
      }
      return target[property];
    }
  });

  return {
    web3: web3,
    eth: eth,
    async cmd(command, ...args) {
      try {
        if (command === 'eth_blockNumber') {
          return await eth.getBlockNumber();
        }
        if (command === 'eth_getBlockByNumber') {
          let data = await eth.getBlock(+args[0], true);
          for (let i = 0; i < data.transactions.length; i++) {
            let receipt = await this.cmd('eth_getTransactionReceipt', data.transactions[i].hash);
            Object.assign(data.transactions[i], {
              receipt,
              gasPrice: (new BigNumber(data.transactions[i].gasPrice)).toString(10),
              value: (new BigNumber(data.transactions[i].value)).toString(10)
            }, {timestamp: data.timestamp});
          }
          return data;
        }
        if (command === 'eth_getTransactionReceipt') {
          return await eth.getTransactionReceipt(args[0]);
        }
      } catch (e) {
        logger.error(e);
        logger.info(`RETRYING ${command}`);
        await sleep();
        return this.cmd(...arguments);
      }
    },
    async getCurrentHeight() {
      return +(await this.cmd('eth_blockNumber'));
    },
    async getBlock(height) {
      let data = await this.cmd('eth_getBlockByNumber', height);
      return {
        hash: data.hash,
        prev_hash: data.parentHash,
        height,
        txs: data.transactions
      }
    }
  }
};

async function sleep() {
  return new Promise(resolve => setTimeout(resolve, 1000));
}
