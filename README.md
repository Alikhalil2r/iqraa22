# Iqraa — School Management SaaS

Multi-tenant school management platform with a public school website, admin dashboard, parent portal, and business-platform modules (CRM, tickets, projects).

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Query |
| Backend | Express.js, TypeScript, PostgreSQL (`pg`) |
| Auth | JWT |

## Project structure

```
iqraa-schoolzip/
├── client/          # Vite React app (port 5000)
├── server/          # Express API (port 3001)
├── package.json     # Root scripts — runs server + client together
└── README.md
```

## Prerequisites (Windows)

1. **Node.js 20+** — [https://nodejs.org](https://nodejs.org)
2. **PostgreSQL 14+** — [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
3. **Git** — [https://git-scm.com/download/win](https://git-scm.com/download/win)

Optional: **GitHub CLI** for issue management.

## Quick start (Windows)

### 1. Clone and install dependencies

```powershell
git clone https://github.com/Alikhalil2r/iqraa22.git
cd iqraa22

npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 2. Create the database

In `psql` or pgAdmin:

```sql
CREATE DATABASE iqraa_school;
```

### 3. Configure environment

```powershell
copy server\.env.example server\.env
copy client\.env.example client\.env
```

Edit `server/.env` — at minimum set `DATABASE_URL` and `JWT_SECRET`. See [SECRETS.md](./SECRETS.md) for all variables and security notes.

### 4. Start development

From the **repository root**:

```powershell
npm run dev
```

This runs both processes via `concurrently`:

| Service | URL | Port |
|---------|-----|------|
| Client (Vite) | http://localhost:5000 | 5000 |
| API (Express) | http://localhost:3001 | 3001 |

The Vite dev server proxies `/api` requests to port 3001.

On first start with `DEMO_MODE=true`, the server creates the schema, seeds demo data, and resets demo passwords.

**Auto-seed policy:** The server only runs `seedDatabase()` on startup when `DEMO_MODE=true` or `SEED_ON_START=true`, and **never** in `NODE_ENV=production` (where `DEMO_MODE=true` is blocked). For a one-off seed in development without demo mode, set `SEED_ON_START=true`. In production, run `npm run db:seed` manually only during initial provisioning if needed.

### 5. Open the app

- Public site: http://localhost:5000
- Admin login: http://localhost:5000/login
- Parent login: http://localhost:5000/parent-login

## Demo credentials

When `DEMO_MODE=true` (default in `server/.env.example`):

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `demo2026` |
| Teacher | `teacher1` | `demo2026` |
| Accountant | `accountant1` | `demo2026` |
| Parent | `parent1` | `demo2026` |

> **Production:** set `DEMO_MODE=false` and use strong unique passwords. Never commit real `.env` files.

## Running server and client separately

Useful when debugging one side only:

```powershell
# Terminal 1 — API (requires PostgreSQL + server/.env)
cd server
npm run dev

# Terminal 2 — Frontend (proxies /api → localhost:3001)
cd client
npm run dev
```

### Other scripts

```powershell
# Root
npm run build          # Build client for production
npm run start          # Start server only (production)

# Server
cd server
npm run db:seed        # Re-seed demo data (with DEMO_MODE=true)

# Client
cd client
npm run build          # Typecheck + Vite build
npm run preview        # Preview production build
```

## Environment variables

| File | Purpose |
|------|---------|
| `server/.env.example` | Database, JWT, demo mode, backups |
| `client/.env.example` | Vite client flags |
| [SECRETS.md](./SECRETS.md) | Full reference — never commit secrets |

## Database

Schema is applied automatically on server startup via `server/src/db/schema.sql`.

Manual seed (development):

```powershell
cd server
npm run db:seed
```

## Troubleshooting

### `npm run dev` fails at root

- Run `npm install` at the **root** (installs `concurrently`).
- Also install in `server/` and `client/`.

### Server exits: `JWT_SECRET environment variable is not set`

Copy `server/.env.example` to `server/.env` and set `JWT_SECRET`.

### `ECONNREFUSED` / database errors

- Ensure PostgreSQL is running.
- Verify `DATABASE_URL` in `server/.env`.
- Create the database: `CREATE DATABASE iqraa_school;`

### Client loads but API calls fail

- Confirm the server is running on port 3001.
- Check Vite proxy in `client/vite.config.ts` (`/api` → `http://localhost:3001`).

### Port already in use

```powershell
netstat -ano | findstr :5000
netstat -ano | findstr :3001
```

Change `PORT` in `server/.env` or the Vite port in `client/vite.config.ts`.

## Docker / Replit

- **Docker (production):** `docker compose up --build` — uses `NODE_ENV=production` and `DEMO_MODE=false`.
- **Docker (demo):** `docker compose -f docker-compose.yml -f docker-compose.demo.yml up --build`
- **Replit:** see `replit.md` for Replit-specific notes and workflows.

## Deployment options

This app needs **Node.js + PostgreSQL + Express API** — static hosting alone is not enough.

| Option | When to use | Steps |
|--------|-------------|-------|
| **A — Local** | Preview on your PC | `npm run dev` → open http://localhost:5000 |
| **B — Tunnel** | Share a temporary public URL | Run locally, then `cloudflared tunnel --url http://localhost:5000` or ngrok |
| **C — Cloud** | Permanent demo/production | Deploy with Docker (`Dockerfile` + `docker-compose.yml` ready). Set `DATABASE_URL`, `JWT_SECRET`, `PUBLIC_URL`, `CORS_ORIGINS`. See [GO-LIVE.md](./GO-LIVE.md) |
| **D — GitHub Pages** | Not suitable | Frontend-only; no API, database, or login |

### Cloud deploy (Render / Railway / Fly.io)

1. Create a **PostgreSQL** database and note `DATABASE_URL`.
2. Deploy the **app** service from this repo (Docker build or `npm run build` + `npm start` in `server/`).
3. Set required env vars: `DATABASE_URL`, `JWT_SECRET` (32+ chars), `NODE_ENV=production`, `DEMO_MODE=false`, `PUBLIC_URL`, `CORS_ORIGINS`.
4. For a quick demo stack with seed data: `docker compose -f docker-compose.yml -f docker-compose.demo.yml up --build` (do not use demo mode in real production).

Health check after deploy: `GET /api/health` → `{"status":"ok"}`.

## Web preview from GitHub (معاينة على الويب)

GitHub Pages **لا يكفي** — التطبيق يحتاج Express + PostgreSQL. استخدم أحد الخيارين:

### Option A — Render (رابط عام دائم)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Alikhalil2r/iqraa22)

1. اضغط الزر أعلاه أو افتح: https://render.com/deploy?repo=https://github.com/Alikhalil2r/iqraa22
2. سجّل الدخول واربط حساب GitHub، ثم اسمح لـ Render بالوصول إلى المستودع الخاص `Alikhalil2r/iqraa22`
3. Render يقرأ `render.yaml` وينشئ **Web Service + PostgreSQL** تلقائياً
4. انتظر حتى يصبح النشر **Live** (5–15 دقيقة في المرة الأولى)
5. افتح الرابط: `https://iqraa-web.onrender.com` (أو الاسم الذي يظهر في لوحة Render)
6. **بيانات تجريبية (مرة واحدة):** في Render → **Shell** → نفّذ:
   ```bash
   cd server && npm run db:seed
   ```
   ثم سجّل الدخول: `admin` / `demo2026`

ملفات النشر: `render.yaml`, `Dockerfile`, `docker-compose.yml`

### Option B — GitHub Codespaces (معاينة سريعة من المتصفح)

1. افتح: https://github.com/Alikhalil2r/iqraa22
2. **Code** → تبويب **Codespaces** → **Create codespace on main**
3. بعد فتح البيئة، في الطرفية:
   ```bash
   npm run dev
   ```
4. عندما يظهر منبّه المنفذ **5000**، اختر **Open in Browser** (أو **Ports** → 5000 → **Globe icon**)
5. الرابط العام يكون مثل: `https://xxxx-5000.app.github.dev`

PostgreSQL و Node.js مُعدّان في `.devcontainer/devcontainer.json` — وضع `DEMO_MODE=true` في `server/.env` يفعّل البيانات التجريبية تلقائياً.

## Implementation plan

Phase 1 (Weeks 1–5) tracks progress in [GitHub Issues](https://github.com/Alikhalil2r/iqraa22/issues) under milestone **M1: Production Foundation**.

## License

Private — Alikhalil2r / Iqraa project.
