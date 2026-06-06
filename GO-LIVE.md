# GO-LIVE Runbook — Iqraa School SaaS

## Pre-flight (48h before)

1. Set `NODE_ENV=production`, `DEMO_MODE=false`
2. Rotate `JWT_SECRET` (min 32 chars) — never commit
3. Enable `ADMIN_2FA_REQUIRED=true` for all admin accounts
4. Configure PostgreSQL backups (see `BACKUP_*` env vars)
5. Run UAT checklist ([UAT-CHECKLIST.md](./UAT-CHECKLIST.md))

## Required production credentials

Copy `server/.env.production.example` → `server/.env` on the host and fill in real values (never commit).

| Service | Env vars | Notes |
|---------|----------|-------|
| PostgreSQL | `DATABASE_URL` | Managed PG 14+ with `?sslmode=require` |
| JWT | `JWT_SECRET` | Required — min 32 chars |
| Public URL | `PUBLIC_URL`, `CORS_ORIGINS` | Payment redirects + browser CORS |
| Auth | `AUTH_REFRESH_COOKIE=true`, `ADMIN_2FA_REQUIRED=true` | Harden admin sessions |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Or per-school SMTP in admin UI |
| Payments | `PAYMENT_MOCK_MODE=false`, `PAYMENT_WEBHOOK_SECRET` | Thawani/PayTabs keys when live |
| SMS | `SMS_PROVIDER=twilio`, `TWILIO_*` | Stub logs without credentials |
| Sentry | `SENTRY_DSN`, `LOG_LEVEL=info` | Optional error tracking |
| S3 uploads | `S3_BUCKET`, `S3_ENDPOINT`, `S3_PUBLIC_URL` | Local `uploads/` fallback |
| Backups | `BACKUP_AUTO`, `BACKUP_DIR`, `BACKUP_RETENTION_DAYS` | See `server/.env.production.example` |

## Deploy with Docker

```bash
export JWT_SECRET="$(openssl rand -hex 32)"
docker compose up -d --build
```

App: http://localhost:3001 (serves API + built client)

## Deploy without Docker

```bash
cd client && npm ci && npm run build
cd ../server && npm ci && npx prisma generate && npm start
```

## Database

- Schema auto-applies on first start via `initDB()` + `schema.sql`
- Prisma migrations: `cd server && npx prisma migrate deploy`

## Multi-tenant schools

Set `schools.slug` per tenant (e.g. `al-noor`). Public API:

```
GET /api/public/school/al-noor
```

## Post go-live monitoring

- Health: `GET /api/health`
- Logs: `LOG_LEVEL=info`
- Sentry dashboard (if configured)
- Nightly backups in `BACKUP_DIR`

## Rollback

1. Restore PostgreSQL from latest backup (`server/backups/`)
2. Redeploy previous Docker image / git tag
3. Verify health + parent login

## Support contacts

Document your school IT contact and hosting provider here before go-live.
