const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const http = require("http");

const logger = require("./middleware/logger");
const blacklist = require("./middleware/blacklist");
const abuseDetector = require("./middleware/abuseDetector");
const endpointSpamDetector = require("./middleware/endpointSpamDetector");
const slidingWindowLimiter = require("./middleware/slidingWindowLimiter");

const circuitBreaker = require("./services/circuitBreaker");
require("./services/redisClient");

const app = express();
app.set("trust proxy", 1);

// Security hardening
app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));

const PORT = process.env.PORT || 8080;
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:3000";

/* ---------------------------------------------------
   MIDDLEWARE
--------------------------------------------------- */
app.use(blacklist);
app.use(slidingWindowLimiter);
app.use(endpointSpamDetector);
app.use(abuseDetector);
app.use(logger);

/* ---------------------------------------------------
   CIRCUIT BREAKER GUARD
--------------------------------------------------- */
app.use((req, res, next) => {
  if (!circuitBreaker.canRequest()) {
    return res.status(503).json({
      error: "Service temporarily unavailable (circuit open)",
    });
  }
  next();
});

/* ---------------------------------------------------
   PROXY
--------------------------------------------------- */
app.use(
  "/api",
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    proxyTimeout: 5000,   // backend timeout
    timeout: 6000,        // overall timeout

    onProxyRes(proxyRes) {
      if (proxyRes.statusCode >= 500) {
        circuitBreaker.recordFailure();
      } else {
        circuitBreaker.recordSuccess();
      }
    },

    onError(err, req, res) {
      circuitBreaker.recordFailure();

      console.error("Proxy Error:", err.message);

      if (!res.headersSent) {
        res.status(502).json({
          error: "Backend service unavailable",
        });
      }
    },
  })
);

/* ---------------------------------------------------
   HEALTH
--------------------------------------------------- */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    circuitState: circuitBreaker.getState(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ---------------------------------------------------
   TEMP STATS
--------------------------------------------------- */
app.get("/gateway/stats", (req, res) => {
  res.json({
    circuitState: circuitBreaker.getState(),
  });
});

/* ---------------------------------------------------
   GRACEFUL SHUTDOWN
--------------------------------------------------- */
const server = http.createServer(app);

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down...");
  server.close(() => {
    process.exit(0);
  });
});

/* ---------------------------------------------------
   START SERVER
--------------------------------------------------- */
server.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});
