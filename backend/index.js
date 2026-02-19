const express = require("express");

const app = express();

app.use(express.json());

// Health endpoint (required for Docker)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

app.get("/hello", (req, res) => {
  res.json({
    message: "Hello from backend",
  });
});

app.get("/login", (req, res) => {
  res.json({
    message: "Login endpoint",
  });
});

const PORT =process.env.BACKEND_PORT|| 3000;

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
