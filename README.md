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

- **Docker:** planned in Phase 1 Week 5 (see GitHub issue #7).
- **Replit:** see `replit.md` for Replit-specific notes and workflows.

## Implementation plan

Phase 1 (Weeks 1–5) tracks progress in [GitHub Issues](https://github.com/Alikhalil2r/iqraa22/issues) under milestone **M1: Production Foundation**.

## License

Private — Alikhalil2r / Iqraa project.
