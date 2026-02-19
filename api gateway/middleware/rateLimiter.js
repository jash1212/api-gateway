const redis = require("../services/redisClient");
const { RATE_LIMIT } = require("../config/constants");
const securityStore = require("../services/redis/redisSecurityStore");

module.exports = async (req, res, next) => {
  const ip = req.ip;
  const key = `rate:${ip}`;

  try {
    const multi = redis.multi();

    multi.incr(key);
    multi.expire(key, RATE_LIMIT.WINDOW_SIZE / 1000);

    const results = await multi.exec();
    const count = results[0];

    if (count > RATE_LIMIT.MAX_REQUESTS) {
      await securityStore.increaseScore(ip, 5);

      return res.status(429).json({
        error: "Rate limit exceeded",
        retryAfterSeconds: Math.ceil(
          RATE_LIMIT.WINDOW_SIZE / 1000
        ),
      });
    }

    next();

  } catch (err) {
    console.error(
      `[RATE_LIMIT_ERROR] ip=${ip} error=${err.message}`
    );

    next(); // fail-open
  }
};
