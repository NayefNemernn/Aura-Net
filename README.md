# Aura Net — Full Stack Business Intelligence Platform

React + Vite frontend · Node.js + Express backend · MongoDB on Railway · Puppeteer BMS scraper

---

## Project structure

```
auranet/
├── backend/          ← Node.js API (deploy to Railway)
│   ├── src/
│   │   ├── server.js
│   │   ├── models/    User  Client  Alert  SyncLog
│   │   ├── routes/    auth  clients  alerts  reports  sync  settings
│   │   ├── middleware/ auth.js
│   │   └── services/  db.js  scraper.js
│   ├── package.json
│   ├── railway.toml
│   └── .env.example
└── frontend/         ← React app (deploy to Vercel)
    ├── src/
    │   ├── pages/     Login  Register  Overview  Clients  Alerts  Reports  Settings
    │   ├── components/layout/Layout.jsx
    │   ├── contexts/  AuthContext.jsx
    │   └── services/  api.js
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── vercel.json
```

---

## Deploy to Railway (backend + frontend + MongoDB)

Both folders deploy as separate Railway services from the same GitHub repo. Each has its
own `railway.toml` (Nixpacks). The backend exposes `/api/health` for healthchecks; the
frontend builds `dist/` and serves it with `serve` (SPA fallback included).

### Step 1 — Push to GitHub

```bash
git push          # repo: https://github.com/NayefNemernn/Aura-Net
```

### Step 2 — Create the project + database

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select **Aura-Net**.
2. On the created service: **Settings → Root Directory** = `backend`.
3. **+ New → Database → MongoDB** — Railway injects `MONGODB_URL` into the project.

### Step 3 — Backend service variables

Backend service → **Variables**:

| Variable             | Value                                             |
|----------------------|---------------------------------------------------|
| `MONGODB_URL`        | reference the MongoDB plugin variable             |
| `JWT_SECRET`         | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | run again, different value                        |
| `BMS_URL`            | `https://bms.libatech.net.lb`                     |
| `BMS_USER` / `BMS_PASS` | your BMS login                                 |
| `FRONTEND_URL`       | frontend URL(s), comma-separated (set after step 4) |
| `NODE_ENV`           | `production`                                      |

### Step 4 — Frontend service

1. Same project: **+ New → GitHub Repo → Aura-Net** again.
2. That service → **Settings → Root Directory** = `frontend`.
3. **Variables** → `VITE_API_URL` = the backend's public URL (Railway URL or `https://api.yourdomain.com`).
   Vite inlines this **at build time** — set it before deploy and redeploy if it changes.

### Step 5 — Custom domain

1. Frontend service → **Settings → Networking → Custom Domain** → add `yourdomain.com` (and `www.yourdomain.com`).
2. Railway shows a **CNAME target** — add it at your DNS registrar. For an apex/root domain use your
   registrar's ALIAS/ANAME (or the record Railway suggests).
3. *(Optional)* give the backend `api.yourdomain.com` the same way.
4. Set backend `FRONTEND_URL` = `https://yourdomain.com,https://www.yourdomain.com` and, if you added an
   API subdomain, frontend `VITE_API_URL` = `https://api.yourdomain.com`. **Redeploy both.**

> **Puppeteer / BMS scraping note:** the backend runs headless Chromium. A plain Nixpacks build may be
> missing the system libraries Chromium needs, so `/api/sync` can fail even when `/api/health` is green.
> If scraping errors on Railway, the fix is a Dockerfile based on a Puppeteer image (or installing
> Chromium + libs) — ask and I'll add it.

---

## Local development

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env     # fill in MONGODB_URL, JWT_SECRET, BMS creds
npm install
npm run dev              # runs on :3001

# Terminal 2 — frontend
cd frontend
cp .env.example .env     # VITE_API_URL=http://localhost:3001
npm install
npm run dev              # runs on :5173
```

---

## API reference

| Method | Path                          | Auth | Description              |
|--------|-------------------------------|------|--------------------------|
| POST   | `/api/auth/register`          | —    | Create account           |
| POST   | `/api/auth/login`             | —    | Get tokens               |
| POST   | `/api/auth/refresh`           | —    | Refresh access token     |
| GET    | `/api/auth/me`                | ✓    | Current user             |
| GET    | `/api/clients`                | ✓    | List clients (paginated) |
| GET    | `/api/clients/stats`          | ✓    | Dashboard stats          |
| GET    | `/api/alerts`                 | ✓    | Open alerts              |
| POST   | `/api/alerts/dismiss-all`     | ✓    | Dismiss alerts           |
| POST   | `/api/sync`                   | ✓    | Trigger BMS sync         |
| GET    | `/api/sync/history`           | ✓    | Last 20 sync logs        |
| GET    | `/api/reports/overview`       | ✓    | Business overview data   |
| GET    | `/api/reports/clients`        | ✓    | Client list (+ CSV)      |
| GET    | `/api/reports/inactive`       | ✓    | Inactive clients         |
| GET    | `/api/reports/expiry`         | ✓    | Expiry forecast          |
| PATCH  | `/api/settings`               | ✓    | Save BMS creds + rules   |
| GET    | `/api/health`                 | —    | Health check             |

---

## Alert rules

| Rule key       | Trigger                                  | Severity |
|----------------|------------------------------------------|----------|
| `inactive30`   | Client not seen in 30+ days              | Critical |
| `statusChange` | Status changed between syncs             | Warning  |
| `batchNew`     | 5+ new clients in one sync               | Info     |
| `expiry7d`     | Account expiring within 7 days           | Warning  |
| `drop10pct`    | Active clients drop 10%+ (off by default)| Critical |
| `syncOk`       | Sync confirmation                        | OK       |

Toggle rules in **Settings → Alert Rules** per user.

---

Built by **AbbasDev** 🇱🇧
