# Care Diagnostics LIMS

> **Laboratory Information Management System** — patients, samples, results, reports & invoices in one dark-themed platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache / WS | Redis 7 |
| Auth | JWT (access + refresh cookies) |
| Container | Docker + Docker Compose |

---

## Quick Start (Local Dev)

### Prerequisites
- Node.js 20+, npm 10+
- PostgreSQL & Redis running (or use Docker)

### 1. Clone & install

```bash
git clone <repo-url>
cd care-digonistcs-main

# Backend dependencies
npm install

# Frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Environment

```bash
# Backend — copy and fill in your values
cp .env.example .env

# Frontend — already configured for local proxy
# No .env.local needed for local dev (proxy forwards /api/* to :4000)
```

**Required `.env` variables:**
```
DATABASE_URL=postgresql://care_user:care_pass@localhost:5432/care_diagnostics
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
PORT=4000
NODE_ENV=development
```

### 3. Database setup

```bash
# Start Postgres + Redis only
docker-compose up postgres redis -d

# Run migrations + seed
npx prisma migrate dev
npx prisma db seed
```

### 4. Run dev servers

```bash
# Terminal 1 — Backend
npm run dev        # starts on :4000

# Terminal 2 — Frontend
cd frontend
npm run dev        # starts on :3000
```

Visit **http://localhost:3000**

**Demo credentials:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@carediagnostics.com | Admin@123456 |
| Doctor | doctor@carediagnostics.com | Doctor@123456 |

---

## Production Deployment

### Option A: Docker Compose (Self-hosted)

```bash
# 1. Set production secrets in .env
cp .env.example .env
# Edit .env with real DATABASE_URL, JWT secrets, etc.

# 2. Build & start everything
docker-compose up -d --build

# Services:
#   Frontend  → http://localhost:3000
#   Backend   → http://localhost:4000
#   Postgres  → localhost:5432
#   Redis     → localhost:6379
```

### Option B: Railway (Recommended Cloud)

**Backend service:**
1. Connect your GitHub repo to Railway
2. Set root directory to `/` (uses `railway.toml`)
3. Add env vars: `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
4. Railway auto-provisions Postgres & Redis plugins

**Frontend service:**
1. Add a second Railway service, set root directory to `/frontend`
2. Add env var: `BACKEND_URL=https://your-backend.railway.app`
3. Railway auto-detects Next.js and builds it

### Option C: Render

Uses the existing `render.yaml`. Connect repo → auto-deploys.

---

## Environment Variables Reference

### Backend (`.env`)
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_URL` | Redis connection string | ✅ |
| `JWT_ACCESS_SECRET` | Access token signing secret (32+ chars) | ✅ |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (32+ chars) | ✅ |
| `PORT` | Server port (default: 4000) | ❌ |
| `NODE_ENV` | `development` or `production` | ❌ |
| `CORS_ORIGIN` | Allowed frontend origin in production | ❌ |

### Frontend (`frontend/.env.local` in production)
| Variable | Description | Required |
|----------|-------------|----------|
| `BACKEND_URL` | Backend base URL for Next.js proxy | ✅ prod only |

---

## Project Structure

```
care-diagnostics/
├── src/                    # NestJS backend
│   ├── modules/
│   │   ├── auth/           # JWT auth, sessions
│   │   ├── patients/       # Patient management
│   │   ├── visits/         # Visit workflows
│   │   ├── tests/          # Test catalog
│   │   ├── samples/        # Sample tracking
│   │   ├── results/        # Lab results
│   │   ├── reports/        # PDF reports
│   │   └── invoices/       # Billing
│   └── shared/             # Guards, utils, middleware
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Migration files
├── frontend/               # Next.js 16 app
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # UI + layout + shared
│   │   └── lib/            # Auth store, API client
│   └── public/             # Static assets
├── docker-compose.yml      # Full stack local setup
├── Dockerfile              # Backend Docker image
└── railway.toml            # Railway deployment config
```

---

## Features

- 🔐 **Role-based access** — Admin, Doctor, Lab Tech, Receptionist, Client
- 👥 **Patient management** — registration, history, demographics
- 🧪 **Lab workflow** — visits → test orders → samples → results → reports
- 📄 **PDF reports** — auto-generated, downloadable
- 💰 **Invoicing** — per-visit billing, payment tracking
- 🔔 **Real-time notifications** — WebSocket-based alerts
- 🤖 **AI Assistant** — built-in chat helper
- 🌑 **Full dark theme** — premium deep navy design
- 📱 **Responsive** — works on mobile, tablet, desktop
