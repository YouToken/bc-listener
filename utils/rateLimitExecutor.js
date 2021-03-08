module.exports = class RateLimitExecutor {

  constructor() {
    this.timeLimit = {};
  }

  async execute(key, rateLimit, promise) {
    return new Promise((resolve, reject) => {
      let now = new Date().getTime();
      this.timeLimit[key] = this.timeLimit[key] || now;
      let timeout = 0;
      if (this.timeLimit[key] > now) {
        timeout = this.timeLimit[key] - now;
        this.timeLimit[key] += rateLimit * 1000;
      } else {
        this.timeLimit[key] = now + rateLimit * 1000;
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