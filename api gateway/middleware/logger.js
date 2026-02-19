const store = require("../services/memoryStore");

module.exports = (req, res, next) => {
  store.incrementTotalRequests();

  const startTime = Date.now();

  const ip = req.ip;
  const method = req.method;
  const path = req.path;

  // Run when response finishes
  res.on("finish", () => {
    const duration = Date.now() - startTime;

    const logEntry = {
      time: new Date().toISOString(),
      ip,
      method,
      path,
      status: res.statusCode,
      durationMs: duration,
    };

    console.log(JSON.stringify(logEntry));
  });

  next();
};
