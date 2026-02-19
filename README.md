# Muslim Planner V1.1

Next.js App Router Muslim planner with:
- **Username/password auth**
- **Per-user, per-year plans**
- **Dynamic sections and tasks**
- **Fast performance** with server-side progress calculation
- **Mobile-first category dashboard**
- **Neon/Vercel Postgres persistence**
- **Drag & Drop Interface** for easy task management (`@hello-pangea/dnd`)
- **Dark Mode** support (`next-themes`)
- **Daily Tracker** for scheduling tasks
- **Location-based Prayer Times** (City/Country)

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

Run the migration script to set up your database schema (tables, indices, etc.):

```bash
npm run migrate
```

This script will sequentially apply all SQL files in `db/migrations/`.

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
4. Run `npm run migrate` during the build process or manually via a one-off task.

## Routes

- `/login`
- `/signup`
- `/` protected planner page

API routes are under `/api/*` and protected by session cookie except auth routes.
