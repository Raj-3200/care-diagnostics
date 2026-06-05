# ─────────────────────────────────────────────────────────────────────────────
# Care Diagnostics — Backend Dockerfile (production-grade, multi-stage)
# Works on: Back4App · Northflank · Railway · Render · any Docker host
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install ALL dependencies + build ────────────────────────────────
FROM node:20-alpine AS builder

# OpenSSL required by Prisma on Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy lockfile and package manifest
COPY package.json package-lock.json ./

# Copy Prisma schema first (needed for generate)
COPY prisma ./prisma/

# Install ALL deps (including devDeps needed for tsc + prisma CLI)
RUN npm ci --prefer-offline

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json ./
COPY src ./src/

RUN npx tsc

# ── Stage 2: Production image (lean) ─────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat wget

WORKDIR /app

# Copy only what's needed to run
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Install PRODUCTION deps only + keep prisma CLI for migrations
# prisma is in devDeps but needed at runtime for migrate deploy
RUN npm ci --omit=dev --prefer-offline
RUN npm install prisma --no-save --prefer-offline

# Re-generate Prisma client in production context
RUN npx prisma generate

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Dynamic port — defaults to 4000, platforms can override with PORT env var
ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

# Health check using wget (already installed)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/v1/health || exit 1

# Startup: run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
