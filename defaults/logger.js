'use strict';

module.exports = new Proxy({}, {
  get(target, method) {
    return function (...args) {
      if (typeof method === 'string') {
        console.log(`[${method.toUpperCase()}] ${JSON.stringify(args)}`);
      }
    }
  }
});
