# Prisma introspection (full schema)

The checked-in `schema.prisma` includes only **School** and **User** models for the auth POC. The live database is still owned by `server/src/db/schema.sql` and the existing `pg` pool.

To pull the **entire** PostgreSQL schema into Prisma (recommended before migrating more routes):

1. Start PostgreSQL and apply the app schema (or use an existing dev DB).
2. Set `DATABASE_URL` in `server/.env` (see `server/.env.example`).
3. From `server/`:

```bash
# Backup current schema if you have local model edits
cp prisma/schema.prisma prisma/schema.prisma.bak

# Pull all tables, enums, and relations from the database
npx prisma db pull

# Regenerate the client
npm run db:generate
```

4. Review diff — `db pull` overwrites `schema.prisma`. Merge any POC-only comments or `@map` tweaks as needed.
5. Use `npx prisma migrate diff` to compare Prisma migrations vs. SQL if you adopt Prisma Migrate later.

**Note:** Do not run `prisma migrate dev` against production until migrations are aligned with `schema.sql`. For now, schema changes continue via SQL; Prisma reads the existing tables.
