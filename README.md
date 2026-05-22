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

## Deploy in 4 steps

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — Aura Net v1.0"
git remote add origin https://github.com/YOUR_USER/auranet.git
git push -u origin main
```

### Step 2 — Railway (backend + MongoDB)

1. Go to [railway.app](https://railway.app) → **New Project**
2. Click **Deploy from GitHub repo** → select your repo → set **Root Directory** to `backend`
3. Railway auto-detects Node.js and runs `npm start`
4. Click **+ New** → **Database** → **MongoDB** — Railway adds it to your project and injects `MONGODB_URL` automatically
5. Go to your backend service → **Variables** → add these:

| Variable             | Value                                             |
|----------------------|---------------------------------------------------|
| `MONGODB_URL`        | *(auto-injected by Railway MongoDB plugin)*        |
| `JWT_SECRET`         | run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | same command again, different value               |
| `BMS_URL`            | `https://bms.libatech.net.lb`                     |
| `BMS_USER`           | `nasri`                                           |
| `BMS_PASS`           | your BMS password                                 |
| `FRONTEND_URL`       | your Vercel URL (set after step 3)                |
| `NODE_ENV`           | `production`                                      |

6. Click **Deploy** — your API will be live at `https://YOUR-APP.up.railway.app`

### Step 3 — Vercel (frontend)

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `VITE_API_URL` = your Railway backend URL (e.g. `https://auranet-backend.up.railway.app`)
4. Click **Deploy**

### Step 4 — Update CORS

Go back to Railway → backend service → Variables → set:
```
FRONTEND_URL = https://your-app.vercel.app
```
Then redeploy.

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
