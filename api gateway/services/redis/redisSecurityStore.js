const redis = require("../redisClient");

class RedisSecurityStore {
  constructor() {
    // key prefixes (clean & scalable)
    this.prefix = "sec";
  }

  /* ---------------------------------------------------
     KEY HELPERS
  --------------------------------------------------- */
  scoreKey(ip) {
    return `${this.prefix}:score:${ip}`;
  }

  offenseKey(ip) {
    return `${this.prefix}:offense:${ip}`;
  }

  blockKey(ip) {
    return `${this.prefix}:block:${ip}`;
  }

  endpointKey(ip, endpoint) {
    return `${this.prefix}:ep:${ip}:${endpoint}`;
  }

  /* ---------------------------------------------------
     ABUSE SCORE
  --------------------------------------------------- */

  async getScore(ip) {
    const score = await redis.get(this.scoreKey(ip));
    return Number(score) || 0;
  }

  async increaseScore(ip, value) {
    const key = this.scoreKey(ip);

    // pipeline → fewer network roundtrips
    const multi = redis.multi();
    multi.incrBy(key, value);
    multi.expire(key, 3600); // auto cleanup after 1h inactivity
    await multi.exec();
  }

  async resetScore(ip) {
    await redis.del(this.scoreKey(ip));
  }

  /* ---------------------------------------------------
     OFFENSE COUNT
  --------------------------------------------------- */

  async getOffenseCount(ip) {
    const count = await redis.get(this.offenseKey(ip));
    return Number(count) || 0;
  }

  async increaseOffense(ip) {
    const key = this.offenseKey(ip);

    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, 24 * 3600); // keep for 24h
    await multi.exec();
  }

  /* ---------------------------------------------------
     BLOCKLIST (TTL BASED)
  --------------------------------------------------- */

  async blockIP(ip, blockSeconds) {
    if (blockSeconds <= 0) return;

    await redis.set(this.blockKey(ip), 1, {
      EX: blockSeconds,
    });
  }

  async isBlocked(ip) {
    return (await redis.exists(this.blockKey(ip))) === 1;
  }

  async getBlockRemainingTime(ip) {
    const ttl = await redis.ttl(this.blockKey(ip));
    return ttl > 0 ? ttl : 0;
  }

  /* ---------------------------------------------------
     ENDPOINT SPAM TRACKING
  --------------------------------------------------- */

  async incrementEndpointHit(ip, endpoint, windowSeconds) {
    const key = this.endpointKey(ip, endpoint);

    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    return count;
  }
}

module.exports = new RedisSecurityStore();
