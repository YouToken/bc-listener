const RippleAPI = require('ripple-lib').RippleAPI;

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

module.exports = class RippleWs {

  init({url, delay = 1000, logger}) {
    const api = new RippleAPI({
      // Available options: https://github.com/ripple/ripple-lib/blob/develop/docs/index.md#parameters
      server: url,
      timeout: 30 * 1000,
      // trace: true
    });

    api.on('error', (errorCode, errorMessage) => {
      logger.error(new Error(`Received error: ${errorCode}, ${errorMessage}`));
    });

    api.on('connected', () => {
      logger.info('Connection is open');
    });

    api.on('disconnected', (code) => {
      if (code !== 1000) {
        logger.error(new Error(`Connection has been closed due to error: ${code}`));
      } else {
        logger.info('Connection has been closed normally');
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
              logger.info(`RETRYING ${method}`);
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