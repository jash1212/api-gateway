const securityStore = require("../services/redis/redisSecurityStore");
const { ABUSE } = require("../config/constants");

module.exports = async (req, res, next) => {
  const ip = req.ip;

  try {
    const score = await securityStore.getScore(ip);

    if (score >= ABUSE.BLOCK_THRESHOLD) {

      await securityStore.increaseOffense(ip);
      const offenses = await securityStore.getOffenseCount(ip);

      const blockTime = ABUSE.BASE_BLOCK_TIME * offenses;
      const blockSeconds = Math.ceil(blockTime / 1000);

      await securityStore.blockIP(ip, blockSeconds);
      await securityStore.resetScore(ip);

      console.log(
        `[ABUSE] IP blocked | ip=${ip} offenses=${offenses} block=${blockSeconds}s`
      );

      return res.status(403).json({
        error: "IP blocked due to repeated abuse",
        retryAfterSeconds: blockSeconds,
      });
    }

    next();

  } catch (err) {
    console.error(
      `[ABUSE_DETECTOR_ERROR] ip=${ip} error=${err.message}`
    );

    next(); // fail-open
  }
};
