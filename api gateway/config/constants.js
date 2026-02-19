const parseNumber = (value, defaultValue) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

module.exports = {
  PORT: parseNumber(process.env.PORT, 8080),

  /* ---------------------------------------------------
     RATE LIMITING (Sliding Window)
  --------------------------------------------------- */
  RATE_LIMIT: {
    WINDOW_SIZE: parseNumber(
      process.env.RATE_WINDOW_SIZE,
      60 * 1000
    ),
    MAX_REQUESTS: parseNumber(
      process.env.RATE_MAX_REQUESTS,
      20
    ),
  },

  /* ---------------------------------------------------
     ABUSE DETECTION
  --------------------------------------------------- */
  ABUSE: {
    BLOCK_THRESHOLD: parseNumber(
      process.env.ABUSE_BLOCK_THRESHOLD,
      30
    ),
    BASE_BLOCK_TIME: parseNumber(
      process.env.ABUSE_BASE_BLOCK_TIME,
      2 * 60 * 1000
    ),
  },

  /* ---------------------------------------------------
     ENDPOINT SPAM DETECTION
  --------------------------------------------------- */
  ENDPOINT_SPAM: {
    WINDOW_SIZE: parseNumber(
      process.env.ENDPOINT_WINDOW_SIZE,
      60 * 1000
    ),
    MAX_HITS: parseNumber(
      process.env.ENDPOINT_MAX_HITS,
      10
    ),
  },

  /* ---------------------------------------------------
     TOKEN BUCKET
  --------------------------------------------------- */
  TOKEN_BUCKET: {
    CAPACITY: parseNumber(
      process.env.TOKEN_BUCKET_CAPACITY,
      20
    ),
    REFILL_RATE: parseNumber(
      process.env.TOKEN_BUCKET_REFILL_RATE,
      5
    ),
  },

  /* ---------------------------------------------------
     CIRCUIT BREAKER
  --------------------------------------------------- */
  CIRCUIT_BREAKER: {
    FAILURE_THRESHOLD: parseNumber(
      process.env.CB_FAILURE_THRESHOLD,
      5
    ),
    RESET_TIMEOUT: parseNumber(
      process.env.CB_RESET_TIMEOUT,
      30 * 1000
    ),
  },
};
