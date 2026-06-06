# Database architecture — Prisma vs schema.sql

## Current strategy (dual-path)

| Layer | Role | Location |
|-------|------|----------|
| **Source of truth** | DDL, migrations, seed | `server/src/db/schema.sql` + `initDB()` |
| **Runtime (majority)** | Raw SQL via `pg` pool | `server/src/db/index.ts`, route handlers |
| **Incremental POC** | Typed queries for new/refactored paths | `server/prisma/schema.prisma` + Prisma Client |

The live PostgreSQL schema is owned by **SQL**, not Prisma Migrate. Prisma is adopted **route-by-route** where type safety or relations help (e.g. `GET /api/auth/me`, `GET /api/students/prisma-poc`).

## Why not full Prisma migration yet?

1. **~80 tables** already defined in `schema.sql`; a big-bang `db pull` + client swap is high risk.
2. **Production deploys** rely on SQL init/migrations today; Prisma Migrate is not aligned with that pipeline.
3. **Drift risk** — editing only `schema.prisma` without updating `schema.sql` breaks non-Prisma routes.

## Rules for contributors

- **Schema changes** → update `server/src/db/schema.sql` first; run against dev DB; document in commit.
- **New Prisma usage** → add models to `schema.prisma` (or run `db pull` after SQL change); run `npm run db:generate`.
- **Do not** run `prisma migrate dev` on production until both paths are unified.
- **Prefer** existing `query()` + `school_id` filters for tenant-scoped tables; Prisma is optional for greenfield endpoints.

## Incremental adoption path

```
1. SQL change in schema.sql
2. Apply to dev DB (initDB / manual)
3. Optional: npx prisma db pull  →  refresh schema.prisma
4. npm run db:generate
5. Migrate one route at a time; keep school_id guards
6. When coverage is high, evaluate prisma migrate diff vs schema.sql
```

See also `server/prisma/INTROSPECT.md` for full `db pull` steps.

## Environment

- `DATABASE_URL` — required for Prisma Client (same DB as `pg` pool).
- Without `DATABASE_URL`, Prisma routes fail gracefully; SQL routes continue to work.

## Future (out of scope for now)

- Single migration authority (either SQL versioned migrations or Prisma Migrate).
- Retire raw `query()` where Prisma gives equivalent safety and performance.
- CI check: `prisma migrate diff` vs `schema.sql` to detect drift.
