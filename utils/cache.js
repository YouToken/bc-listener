module.exports = class Cache {

  constructor() {
    this.cache = {};
  }

  async getWithCache(key, promise, lifetime = 60) {
    let item = this.cache[key];
    if (!item || new Date().getTime() > item.expireAt) {
      this.cache[key] = {
        data: promise()
          .then(result => result)
          .catch(e => {
            delete this.cache[key];
            throw e;
          }),
        expireAt: new Date().getTime() + lifetime * 1000
      }
    }
    return this.cache[key].data;
  }
}