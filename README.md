# 🚦 Abuse-Aware API Gateway

A lightweight, production-ready **API Gateway** built with **Node.js, Express, and Redis** that sits in front of backend services and protects them from abuse, spam, and excessive traffic.

This gateway is more than just a rate limiter — it includes sliding window rate limiting, abuse detection, temporary IP blocking, and Redis-based tracking for scalable protection.

---

## ✨ Features

* ⚡ Sliding Window Rate Limiting
* 🚫 Automatic Abuse Detection
* ⛔ Temporary & Escalating IP Blocking
* 🔁 Redis-based Distributed Tracking
* 🧠 Configurable Thresholds
* 🏥 Health Checks for Services
* 🐳 Dockerized Setup
* 🔐 Environment-based Configuration

---

## 🏗️ Architecture

Client → API Gateway → Backend Service

The gateway acts as a protective layer between clients and backend APIs.

### Flow:

1. Client sends request.
2. Gateway checks rate limits (Sliding Window).
3. Gateway evaluates abuse score.
4. If safe → Forward to backend.
5. If abusive → Block temporarily.

---

## 🛠️ Tech Stack

* Node.js
* Express.js
* Redis
* Docker

---

## 📦 Installation

### 1️⃣ Clone the repository

```bash
git clone <your-repo-url>
cd abuse-aware-api-gateway
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Configure environment variables

Create a `.env` file:

```env
PORT=8080
REDIS_URL=redis://redis:6379
```

---

## 🐳 Docker Setup (Recommended)

```bash
docker-compose up --build
```

Services:

* API Gateway
* Redis
* Backend Service

---

## ⚙️ Configuration

Inside `config.js`:

```js
RATE_LIMIT: {
  WINDOW_SIZE: 60 * 1000, // 1 minute
  MAX_REQUESTS: 20,
},

ABUSE: {
  BLOCK_THRESHOLD: 30,
  BASE_BLOCK_TIME: 2 * 60 * 1000,
}
```

You can tune:

* Maximum requests per window
* Abuse threshold
* Block duration

---

## 🚀 Running Locally

```bash
npm start
```

Server runs at:

```
http://localhost:8080
```

---

## 🔒 Abuse Detection Strategy

The gateway tracks:

* Request frequency
* Repeated violations
* Escalating abuse patterns

When abuse threshold is crossed:

* IP gets blocked
* Block duration increases progressively

This prevents:

* Brute force attacks
* API scraping
* Request flooding

---

## 📊 Production Considerations

* Use Redis cluster for scalability
* Deploy behind NGINX or Load Balancer
* Enable logging & monitoring
* Add HTTPS termination
* Configure proper CORS policies

---

## 🧪 Future Improvements

* Admin dashboard for blocked IPs
* Analytics panel
* JWT validation at gateway level
* Request payload inspection
* Anomaly detection using ML

---

## 📄 License

This project is built for educational and learning purposes.

---

## 👨‍💻 Author

Built with focus on backend engineering and system design principles.
