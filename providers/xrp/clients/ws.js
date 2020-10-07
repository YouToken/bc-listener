const RippleAPI = require('ripple-lib').RippleAPI;

function log(level, msg) {
  if (level === "error") {
    logger[level](new Error(msg));
  } else {
    logger[level](`listener:xrp ${msg}`);
  }
}

function shouldReconnect(e) {
  return e.name && (e.name === 'TimeoutError' || e.name === 'DisconnectedError');
}

function shouldRetryRequest(e) {
  return !(e.message && (e.message === 'lgrNotFound' || e.message === 'lgrIdxsInvalid' || e.message === 'actNotFound'))
    && !(e.name && e.name === 'ValidationError');
}

async function sleep(delay) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

module.exports = class RippleWs  {

  init({url, delay = 1000, logger}) {
    const api = new RippleAPI({
      // Available options: https://github.com/ripple/ripple-lib/blob/develop/docs/index.md#parameters
      server: url,
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
            if (shouldReconnect(e)) {
              try {
                await api.disconnect();
                await api.connect();
              } catch (e) {
                logger.error(e);
              }
            }
            if (method !== 'getSettings' && shouldRetryRequest(e)) {
              log('info', `RETRYING ${method}`);
              await sleep(delay);
              return exec(...args);
            }
            throw e;
          }
        }

        return exec;
      }
    });
  }
}