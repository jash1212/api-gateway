const securityStore = require("../services/redis/redisSecurityStore");

const WINDOW_SECONDS = 60;
const MAX_ENDPOINT_HITS = 10;

module.exports = async (req, res, next) => {
  const ip = req.ip;

  // simple endpoint normalization
  const endpoint =
    req.baseUrl + (req.route?.path || req.path);

  try {
    const count = await securityStore.incrementEndpointHit(
      ip,
      endpoint,
      WINDOW_SECONDS
    );

    if (count > MAX_ENDPOINT_HITS) {
      console.log(
        `[SPAM] endpoint abuse | ip=${ip} endpoint=${endpoint}`
      );

      await securityStore.increaseScore(ip, 3);

      // optional: prevent repeated penalties in same window
      // (advanced: move to lua later)
    }

    next();

  } catch (err) {
    console.error(
      `[ENDPOINT_SPAM_ERROR] ip=${ip} error=${err.message}`
    );

    next(); // fail-open
  }
};
