# Ramadan Planner V1.1

Next.js App Router Ramadan planner with:
- Username/password auth
- Per-user, per-year plans
- Dynamic sections and tasks
- Prayer section split into 5 daily prayers
- Vercel Postgres persistence

## 1) Install

```bash
npm install
```

## 2) Environment variables

Copy `.env.example` to `.env.local` and set:

- `POSTGRES_URL`
- `AUTH_SECRET`

Do not expose these variables to the client (`NEXT_PUBLIC_*`).

## 3) Database migration

Run the migration files in `db/migrations/` sequentially against your database (e.g., Vercel or Neon Postgres).

```bash
psql $POSTGRES_URL < db/migrations/001_init.sql
psql $POSTGRES_URL < db/migrations/002_add_indices.sql
```

## Performance Considerations
- Database indices exist on all foreign keys for fast JOIN performance.
- Progress calculation is done server-side using PostgreSQL aggregation.
- After state mutations (reorder, update), the application automatically synchronizes with the database.


## 4) Run locally

```bash
npm run dev
```

## 5) Deploy on Vercel

1. Import project in Vercel.
2. Attach Vercel Postgres.
3. Set `AUTH_SECRET` in Vercel environment variables.
4. Run migration SQL once on the production DB.

## Routes

- `/login`
- `/signup`
- `/` protected planner page

API routes are under `/api/*` and protected by session cookie except auth routes.
