const redis = require("../services/redisClient");
const store = require("../services/redis/redisSecurityStore");
const { TOKEN_BUCKET } = require("../config/constants");

const CAPACITY = TOKEN_BUCKET.CAPACITY;
const REFILL_RATE = TOKEN_BUCKET.REFILL_RATE; // tokens per second

module.exports = async (req, res, next) => {
  const ip = req.ip;
  const key = `tb:${ip}`;

  const now = Date.now();

  try {
    /* ---------------------------------------------------
       GET CURRENT BUCKET STATE
    --------------------------------------------------- */
    const data = await redis.hGetAll(key);

    let tokens = data.tokens ? parseFloat(data.tokens) : CAPACITY;
    let lastRefill = data.lastRefill
      ? parseInt(data.lastRefill)
      : now;

    /* ---------------------------------------------------
       REFILL TOKENS BASED ON TIME PASSED
    --------------------------------------------------- */
    const elapsedSeconds = (now - lastRefill) / 1000;
    const refill = elapsedSeconds * REFILL_RATE;

    tokens = Math.min(CAPACITY, tokens + refill);

    /* ---------------------------------------------------
       CHECK TOKEN AVAILABILITY
    --------------------------------------------------- */
    if (tokens < 1) {
      await securityStore.increaseScore(ip, 4);

      return res.status(429).json({
        error: "Token bucket limit exceeded",
        retryAfterSeconds: 1,
      });
    }

    // Consume token
    tokens -= 1;

    /* ---------------------------------------------------
       SAVE UPDATED STATE
    --------------------------------------------------- */
    await redis.hSet(key, {
      tokens,
      lastRefill: now,
    });

    // Auto clean idle buckets
    await redis.expire(key, 120);

    next();

  } catch (err) {
    console.error(
      `[TOKEN_BUCKET_ERROR] ip=${ip} error=${err.message}`
    );

    // Fail open (gateway still works)
    next();
  }
};
