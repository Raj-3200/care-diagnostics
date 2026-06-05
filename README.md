# Care Diagnostics — Backend API

> **Express/Node.js REST API** deployed on **Vercel** as serverless functions.
> Frontend at: [care-diagnostics-frontend](https://github.com/Raj-3200/care-diagnostics-frontend)

## Stack
- Node.js 20 · TypeScript · Express.js · Prisma ORM
- PostgreSQL · Redis · JWT (HttpOnly cookies)
- Deployed as Vercel Serverless Functions

---

## 🚀 Deploy on Vercel (Backend API)

### Step 1 — Import to Vercel
1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Import `Raj-3200/care-diagnostics-backend`
3. Framework preset: **Other** (not Next.js)

### Step 2 — Set Environment Variables
In Vercel → Project → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://...` (from Supabase / Neon / PlanetScale) |
| `REDIS_URL` | `redis://...` (from Upstash — free serverless Redis) |
| `JWT_ACCESS_SECRET` | any 32+ random chars |
| `JWT_REFRESH_SECRET` | any other 32+ random chars |
| `JWT_ACCESS_EXPIRY` | `15m` |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` |
| `NODE_ENV` | `production` |

### Step 3 — Deploy
Click **Deploy** → Vercel runs `npm run vercel-build` (prisma generate + tsc) automatically.

### Step 4 — Run Migrations (first time only)
```bash
# Install Vercel CLI
npm i -g vercel

# Run migration against your production DB
DATABASE_URL="your-prod-db-url" npx prisma migrate deploy
DATABASE_URL="your-prod-db-url" npx prisma db seed
```

### Step 5 — Connect Frontend
Copy your Vercel backend URL (e.g. `https://care-backend.vercel.app`)
→ Set as `BACKEND_URL` in your **frontend** Vercel project settings.
→ Set as `CORS_ORIGIN` in your **backend** Vercel project settings (use frontend URL).

---

## 🗄️ Recommended Free Databases

| Service | Type | Free Tier |
|---------|------|-----------|
| **[Neon](https://neon.tech)** | PostgreSQL | ✅ 0.5 GB |
| **[Supabase](https://supabase.com)** | PostgreSQL | ✅ 500 MB |
| **[Upstash](https://upstash.com)** | Redis | ✅ 10k req/day |

---

## Local Development

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT secrets etc.
npx prisma migrate dev
npx prisma db seed
npm run dev            # → http://localhost:4000
```

---

## API Endpoints

| Module | Base Path |
|--------|-----------|
| Health | `GET /api/v1/health` |
| Auth | `/api/v1/auth` |
| Patients | `/api/v1/patients` |
| Visits | `/api/v1/visits` |
| Tests | `/api/v1/tests` |
| Samples | `/api/v1/samples` |
| Results | `/api/v1/results` |
| Reports | `/api/v1/reports` |
| Invoices | `/api/v1/invoices` |
| Users | `/api/v1/users` |

**API Docs:** `GET /api-docs` (Swagger UI)

---

## Demo Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@carediagnostics.com | Admin@123456 |
| Doctor | doctor@carediagnostics.com | Doctor@123456 |
| Lab Tech | labtech@carediagnostics.com | Labtech@123456 |
