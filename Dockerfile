# ---- Backend Dockerfile ----
FROM node:20-alpine AS base

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install all dependencies (need devDeps for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src/

# Build TypeScript
RUN npx tsc

# Remove dev dependencies
RUN npm prune --production

# Expose port
EXPOSE 4000

# Run migrations then start server
CMD npx prisma migrate deploy && node dist/server.js
