'use strict';

const _ = require('lodash');
const {logger} = require('./defaults');

module.exports = ({saveUnconfirmed=()=>{}, clearUnconfirmed=()=>{}, confirm=()=>{}, isParent=()=>{}}, max_length=10, logger=logger) => {
  let id = _.uniqueId('chain_');
  log('debug', `just created chain=${id} with max_length=${max_length}`);
  let chain = [];
  return {
    get id() {return id;},
    push(smth) {
      log('debug', 'push to chain');
      let toClear = [];
      let toConfirm = [];
      let found = false;
      for (let i = 0; i < chain.length; i++) {
        if (isParent(chain[i], smth)) {
          log('debug', 'parent found');
          toClear = toClear.concat(chain.slice(i + 1));
          chain = chain.slice(0, i + 1);
          chain.push(smth);
          found = true;
          break;
        }
      }
      if (!found && !chain.length) {
        log('debug', 'initial block');
        chain = [smth];
      } else if (!found) {
        log('debug', 'parent not found');
        throw new Error('parent not found');
      }
      log('debug', `chain length=${chain.length}, max_length=${max_length}`);
      while (chain.length >= max_length) toConfirm.push(chain.shift());

      clearUnconfirmed(toClear);
      saveUnconfirmed([smth]);
      confirm(toConfirm);
    },
    getUnconfirmed() {return chain},
    clear() {chain = []}
  };

  function log(level, msg) {
    let s = 'listener';
    if (id) s += `:${id}`;
    logger[level](`${s} ${msg}`);
  }
};
