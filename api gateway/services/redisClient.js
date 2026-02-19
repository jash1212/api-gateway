const { createClient } = require("redis");

const REDIS_URL =
  process.env.REDIS_URL || "redis://redis:6379";

const client = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("❌ Redis retry attempts exhausted");
        return new Error("Retry attempts exhausted");
      }
      return Math.min(retries * 100, 3000); // exponential backoff
    },
    connectTimeout: 5000,
  },
});

/* ---------------------------------------------------
   REDIS EVENTS
--------------------------------------------------- */

client.on("error", (err) => {
  console.error("[REDIS ERROR]", err.message);
});

client.on("connect", () => {
  console.log("🔌 Connecting to Redis...");
});

client.on("ready", () => {
  console.log("✅ Redis is ready");
});

client.on("reconnecting", () => {
  console.log("♻️ Redis reconnecting...");
});

/* ---------------------------------------------------
   CONNECT
--------------------------------------------------- */

async function connectRedis() {
  try {
    await client.connect();
  } catch (err) {
    console.error("❌ Failed to connect Redis:", err.message);

    // In production, allow container restart policy to handle it
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}

connectRedis();

/* ---------------------------------------------------
   GRACEFUL SHUTDOWN
--------------------------------------------------- */

async function shutdown() {
  try {
    await client.quit();
    console.log("🛑 Redis connection closed");
  } catch (err) {
    console.error("Error during Redis shutdown:", err.message);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = client;
