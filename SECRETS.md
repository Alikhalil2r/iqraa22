# Secrets & Environment Variables

**Never commit real secrets.** This repo ignores `.env` files via `.gitignore`. Use `.env.example` as templates only.

## Setup checklist

1. Copy examples:
   ```powershell
   copy server\.env.example server\.env
   copy client\.env.example client\.env
   ```
   For production deployment, use `server/.env.production.example` as the template (set `DEMO_MODE=false`, TLS `DATABASE_URL`, etc.).
2. Generate a strong `JWT_SECRET` (32+ random characters).
3. Set `DATABASE_URL` to your local or hosted PostgreSQL connection string.
4. For production: set `DEMO_MODE=false` and disable demo seeding.

## Server (`server/.env`)

| Variable | Required | Default / example | Description |
|----------|----------|-------------------|-------------|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/iqraa_school` | PostgreSQL connection string |
| `PORT` | No | `3001` | Express API port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `JWT_SECRET` | Yes | *(generate)* | Signs auth tokens — min 32 chars in production |
| `DEMO_MODE` | No | `true` | Seeds demo data; **must be `false` in production** |
| `BACKUP_AUTO` | No | `true` | Enable scheduled backups |
| `BACKUP_ON_START` | No | `true` | Backup when server starts |
| `BACKUP_DIR` | No | `./backups` | Backup file directory |
| `BACKUP_HOUR` | No | `3` | Hour (0–23) for daily backup |
| `BACKUP_RETENTION_DAYS` | No | `30` | Days to keep backups |
| `BACKUP_MAX_FILES` | No | `60` | Max backup files |
| `BACKUP_CHECK_MS` | No | `900000` | Scheduler interval (ms) |
| `AUTH_REFRESH_COOKIE` | No | `false` | `true` = refresh token in httpOnly cookie |
| `ADMIN_2FA_REQUIRED` | No | `true` | Enforce 2FA for admin roles (off when `DEMO_MODE=true`) |
| `PUBLIC_URL` | Prod | `http://localhost:5000` | Public app URL for payment redirects |
| `CORS_ORIGINS` | Prod | *(empty)* | Comma-separated allowed browser origins |
| `PAYMENT_MOCK_MODE` | No | `true` | `false` for live payment gateways |
| `PAYMENT_WEBHOOK_SECRET` | Prod | *(empty)* | Verifies provider webhook signatures |
| `SUPER_ADMIN_PASSWORD` | No | *(empty)* | Creates `superadmin` user on first run if no `super_admin` exists |
| `SEED_ON_START` | No | *(unset)* | Auto-seed on startup in non-production (with `DEMO_MODE` or alone) |
| `SENTRY_DSN` | No | *(empty)* | Sentry error tracking DSN |
| `LOG_LEVEL` | No | `debug` / `info` | `info` recommended in production |
| `SMTP_*` | No | *(empty)* | Global SMTP fallback (school-level SMTP in DB preferred) |
| `SMS_PROVIDER` | No | `stub` | `twilio` for live SMS |
| `TWILIO_*` | No | *(empty)* | Twilio credentials when `SMS_PROVIDER=twilio` |
| `UPLOAD_DIR` | No | `./uploads` | Local upload directory |
| `S3_BUCKET`, `S3_ENDPOINT`, `S3_PUBLIC_URL` | No | *(empty)* | S3-compatible object storage |

See **`server/.env.production.example`** for a production-ready template with all variables grouped and commented.

### Per-school secrets (database, not `.env`)

SMTP credentials are stored per school in `school_settings` (`smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`). Configure these via the admin UI — do not put school SMTP passwords in `.env`.

## Client (`client/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_DEMO_MODE` | No | `false` | Shows demo banner in the UI when `true` |

Vite only exposes variables prefixed with `VITE_`. The API base URL is `/api` (proxied to the server in development).

## Generating `JWT_SECRET` (PowerShell)

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

Or use any cryptographically secure random string generator.

## What must never be committed

- `server/.env`, `client/.env`, or any file with real credentials
- Database dumps containing user passwords
- `smtp_pass` values exported from production
- API keys, OAuth client secrets, or payment gateway keys (future phases)

## Production hardening

- `DEMO_MODE=false`
- Strong unique `JWT_SECRET`
- PostgreSQL over TLS (`sslmode=require` in `DATABASE_URL`)
- Restrict database user permissions
- Rotate `JWT_SECRET` only with a planned session invalidation strategy
