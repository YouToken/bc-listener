const RippleAPI = require('ripple-lib').RippleAPI;

module.exports = (addr, logger) => {

  function log(level, msg) {
    logger[level](`listener:xrp ${msg}`);
  }

  function shouldRetryRequest(e) {
    return !(e.message && (e.message === 'lgrNotFound' || e.message === 'lgrIdxsInvalid'))
      && !(e.name && e.name === 'ValidationError');
  }

  async function sleep() {
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  const api = new RippleAPI({
    // Available options: https://github.com/ripple/ripple-lib/blob/develop/docs/index.md#parameters
    server: addr,
    timeout: 30 * 1000,
    // trace: true
  });

  api.on('error', (errorCode, errorMessage) => {
    log('error', `Received error: ${errorCode}, ${errorMessage}`);
  });

  api.on('connected', () => {
    log('info', 'Connection is open');
  });

  api.on('disconnected', (code) => {
    if (code !== 1000) {
      log('error', `Connection has been closed due to error: ${code}`);
    } else {
      log('info', 'Connection has been closed normally');
    }
  });

  return new Proxy({}, {
    get(target, method) {
      async function exec(...args) {
        try {
          if (!api.isConnected()) {
            await api.connect();
          }
          return await api[method](...args);
        } catch (e) {
          logger.error(e);
          if (shouldRetryRequest(e)) {
            log('info', `RETRYING ${method}`);
            await sleep();
            return exec(...args);
          }
          throw e;
        }
      }

      return exec;
    }
  });
};