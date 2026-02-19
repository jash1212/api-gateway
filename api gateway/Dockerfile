# ---------- Stage 1: Install Dependencies ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (production only)
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built app from builder
COPY --from=builder /app /app

# Use non-root user
USER appuser

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "index.js"]
