const securityStore = require("../services/redis/redisSecurityStore");

module.exports = async (req, res, next) => {
  const ip = req.ip;

  try {
    /* ---------------------------------------------------
       CHECK IF IP IS BLOCKED
    --------------------------------------------------- */
    if (await securityStore.isBlocked(ip)) {
      const retryAfter =
        await securityStore.getBlockRemainingTime(ip);

      return res.status(403).json({
        error: "Your IP is temporarily blocked due to suspicious activity.",
        retryAfterSeconds: retryAfter,
      });
    }

    next();

  } catch (err) {
    /* ---------------------------------------------------
       FAIL-OPEN STRATEGY
       Gateway should not crash if Redis fails
    --------------------------------------------------- */
    console.error(
      `[BLACKLIST_ERROR] ip=${ip} error=${err.message}`
    );

    next();
  }
};
