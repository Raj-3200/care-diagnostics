# Care Diagnostics — Backend API

> **NestJS REST API** for the Care Diagnostics LIMS.
> Deployed on **Northflank** | Frontend on Vercel

## Stack
- Node.js 20 · TypeScript · NestJS · Prisma ORM
- PostgreSQL 16 · Redis 7 · JWT (HttpOnly cookies)
- Docker (multi-stage, non-root, health check)

---

## Deploy on Northflank

### Step 1 — Add PostgreSQL & Redis

In your Northflank project (`Care-Daignostics`):
1. Click **"Deploy PostgreSQL"** → create addon → note the connection URL
2. Click **"Deploy Redis"** → create addon → note the connection URL

### Step 2 — Deploy the Backend Service

1. Click **"Deploy a repository"**
2. Select `Raj-3200/care-diagnostics-backend`
3. Northflank detects the `Dockerfile` automatically
4. Set **Port** to `4000`

### Step 3 — Set Environment Variables

In Northflank service → **"Environment"** tab:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...     ← from PostgreSQL addon
REDIS_URL=redis://...             ← from Redis addon
JWT_ACCESS_SECRET=                ← generate 32+ random chars
JWT_REFRESH_SECRET=               ← generate 32+ random chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=https://your-app.vercel.app
```

### Step 4 — Run Database Seed (First time only)

In Northflank service → **"Shell"** tab:
```bash
npx prisma db seed
```

> Migrations run automatically on startup via the Dockerfile CMD.

### Step 5 — Copy your backend URL

Copy the public URL from Northflank (e.g. `https://care-backend-xxx.northflank.app`)
→ Paste as `BACKEND_URL` in your Vercel frontend settings.

---

## Environment Variables Reference

```env
# Database (from Northflank PostgreSQL addon)
DATABASE_URL=postgresql://user:pass@host:5432/care_diagnostics

# Cache (from Northflank Redis addon)
REDIS_URL=redis://host:6379

# JWT — generate strong random strings (min 32 chars)
JWT_ACCESS_SECRET=your-access-secret-min-32-characters-here
JWT_REFRESH_SECRET=your-refresh-secret-min-32-characters-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server
PORT=4000
NODE_ENV=production

# CORS — set to your Vercel frontend URL
CORS_ORIGIN=https://care-diagnostics.vercel.app

# Optional — AI assistant
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Local Development

```bash
npm install

# Copy env file and fill in values
cp .env.example .env

# Start Postgres + Redis via Docker
docker compose up postgres redis -d

# Run migrations + seed
npx prisma migrate dev
npx prisma db seed

# Start dev server
npm run dev   # → http://localhost:4000
```

**Health check:** `GET http://localhost:4000/api/v1/health`

---

## API Modules

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /api/v1/auth/login`, `/logout`, `/refresh`, `GET /me` |
| Patients | `GET/POST /api/v1/patients` |
| Visits | `GET/POST /api/v1/visits` |
| Tests | `GET/POST /api/v1/tests` |
| Samples | `GET/POST /api/v1/samples` |
| Results | `GET/POST /api/v1/results` |
| Reports | `GET/POST /api/v1/reports` |
| Invoices | `GET/POST /api/v1/invoices` |
| Users | `GET/POST /api/v1/users` |
| Health | `GET /api/v1/health` |

---

## Demo Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@carediagnostics.com | Admin@123456 |
| Doctor | doctor@carediagnostics.com | Doctor@123456 |
| Lab Tech | labtech@carediagnostics.com | Labtech@123456 |
