const redis = require("../services/redisClient");
const securityStore = require("../services/redis/redisSecurityStore");
const { RATE_LIMIT } = require("../config/constants");

const WINDOW = RATE_LIMIT.WINDOW_SIZE; // ms
const MAX_REQUESTS = RATE_LIMIT.MAX_REQUESTS;

module.exports = async (req, res, next) => {
  const ip = req.ip;
  const key = `sw:${ip}`;

  const now = Date.now();
  const windowStart = now - WINDOW;

  try {
    const multi = redis.multi();

    /* -----------------------------------------
       ATOMIC SLIDING WINDOW
    ----------------------------------------- */

    // remove old requests
    multi.zRemRangeByScore(key, 0, windowStart);

    // add current request FIRST
    multi.zAdd(key, {
      score: now,
      value: `${now}-${process.hrtime.bigint()}`,
    });

    // count requests AFTER adding
    multi.zCard(key);

    // auto cleanup
    multi.expire(key, Math.ceil(WINDOW / 1000));

    const results = await multi.exec();

    // zCard result index (now index 2)
    const count = results[2];

    if (count > MAX_REQUESTS) {
      await securityStore.increaseScore(ip, 1);

      return res.status(429).json({
        error: "Sliding window limit exceeded",
        retryAfterSeconds: Math.ceil(WINDOW / 1000),
      });
    }

    next();

  } catch (err) {
    console.error(
      `[SLIDING_WINDOW_ERROR] ip=${ip} error=${err.message}`
    );

    next(); // fail-open
  }
};
