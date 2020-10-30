'use strict';

const Web3 = require('web3');
const util = require('util');
const BigNumber = require('bignumber.js');

module.exports = class EthereumRpc {

  constructor({url}) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(url));

    this.eth = new Proxy(this.web3.eth, {
      get(target, property) {
        if (util.isFunction(target[property])) {
          return function (...args) {
            return new Promise((resolve, reject) => target[property](...args, (err, result) => err ? reject(err) : resolve(result)));
          }
        }
        return target[property];
      }
    });
  }

  async cmd(command, ...args) {
    if (command === 'eth_blockNumber') {
      return this.eth.getBlockNumber();
    }
    if (command === 'eth_getBlockByNumber') {
      let data = await this.eth.getBlock(+args[0], true);
      for (let tx of data.transactions) {
        tx.receipt = await this.cmd('eth_getTransactionReceipt', tx.hash);
        tx.gasPrice = (new BigNumber(tx.gasPrice)).toString(10);
        tx.value = (new BigNumber(tx.value)).toString(10);
        tx.timestamp = data.timestamp;
      }
      return data;
    }
    if (command === 'eth_getTransactionReceipt') {
      return this.eth.getTransactionReceipt(args[0]);
    }
  }

  async getCurrentHeight() {
    return +(await this.cmd('eth_blockNumber'));
  }

  async getBlock(height) {
    let data = await this.cmd('eth_getBlockByNumber', height);
    return {
      hash: data.hash,
      prev_hash: data.parentHash,
      height,
      timestamp: new Date(+data.timestamp * 1000),
      txs: data.transactions
    }
  }
}
