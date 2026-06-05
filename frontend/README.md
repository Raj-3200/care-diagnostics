# Care Diagnostics — Frontend

> **Next.js 16** frontend for the Care Diagnostics LIMS.
> Deployed on **Vercel** | Backend API on Northflank

## Stack
- Next.js 16 (App Router) · TypeScript · Tailwind CSS · shadcn/ui
- Zustand (localStorage session persistence) · Axios · Framer Motion
- Full dark theme — deep navy design system

---

## Deploy on Vercel (One Click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Raj-3200/care-diagnostics-frontend)

### Manual Vercel Deploy

1. Go to **[vercel.com](https://vercel.com)** → **Add New Project**
2. Import `Raj-3200/care-diagnostics-frontend`
3. Framework preset: **Next.js** (auto-detected)
4. Add **Environment Variable**:
   ```
   BACKEND_URL = https://your-backend.northflank.app
   ```
5. Click **Deploy** ✅

> **That's it.** Vercel handles builds, CDN, SSL, and auto-deploys on every `git push`.

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BACKEND_URL` | Your Northflank backend URL | ✅ Production |

> In development, `BACKEND_URL` defaults to `http://localhost:4000` — no `.env.local` needed.

---

## Local Development

```bash
npm install
npm run dev   # → http://localhost:3000
```

Backend must be running on port 4000. The Next.js proxy forwards `/api/*` → `localhost:4000/api/*`.

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/        # Protected LIMS pages
│   ├── login/            # Auth page
│   └── globals.css       # Dark theme design system
├── components/
│   ├── ui/               # Dark-themed shadcn/ui components
│   ├── layout/           # Sidebar, Header (responsive)
│   └── shared/           # DataTable, AI Assistant, etc.
└── lib/
    ├── auth-store.ts     # Zustand + localStorage persistence
    ├── api.ts            # Axios with auto token refresh
    └── providers.tsx     # React Query + Theme providers
```
