'use strict';

module.exports = new Proxy({}, {
  get(target, method) {
    return function (...args) {
      console.log(`[${method.toUpperCase()}] ${JSON.stringify(args)}`);
    }
  }
});
