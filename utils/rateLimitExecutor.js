module.exports = class RateLimitExecutor {

  constructor() {
    this.timeLimit = {};
  }

  /**
   *
   * @param key request key
   * @param rateLimit requests per second
   * @param promise request
   * @returns {Promise<unknown>}
   */
  async execute(key, rateLimit, promise) {
    return new Promise((resolve, reject) => {
      let now = new Date().getTime();
      this.timeLimit[key] = this.timeLimit[key] || now;
      let timeout = 0;
      if (this.timeLimit[key] > now) {
        timeout = this.timeLimit[key] - now;
        this.timeLimit[key] += Math.round(1000 / rateLimit);
      } else {
        this.timeLimit[key] = now + Math.round(1000 / rateLimit);
      }
      setTimeout(() => {
        promise()
          .then(data => {
            resolve(data);
          })
          .catch(e => {
            reject(e);
          });
      }, timeout);
    });
  }
}
