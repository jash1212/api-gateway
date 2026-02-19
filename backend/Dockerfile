# ---------- Stage 1: Install Dependencies ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy app from builder
COPY --from=builder /app /app

# Switch to non-root user
USER appuser

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "index.js"]
