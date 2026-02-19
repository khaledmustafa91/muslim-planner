# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (Turbopack)
npm run build     # Build for production (runs migrations first)
npm run migrate   # Run database migrations manually
npm run lint      # Run ESLint
```

## Environment Setup

Create `.env.local` with:
```
POSTGRES_URL=     # PostgreSQL connection string (Neon or local)
AUTH_SECRET=      # JWT signing secret (min 32 characters)
```

The database driver is selected automatically: **Neon HTTP** driver in production (when `POSTGRES_URL` contains `neon.tech`), **pg Pool** locally. See `lib/sql.ts`.

Database migrations live in `/db/migrations/` and must be applied sequentially (001–006). `npm run build` runs `scripts/migrate.ts` automatically.

## Architecture

**Full-stack Next.js app** for tracking Ramadan daily tasks and prayers. Arabic/RTL UI with dark mode.

### Key Directories

- `/app/api/` — REST API routes (all protected by `middleware.ts` except `/api/auth/*`)
- `/app/(pages)/` — Next.js App Router pages
- `/components/` — React components; `/components/ui/` has generic reusables (Modal, ConfirmModal, SearchableSelect)
- `/lib/` — Shared utilities: `db.ts` (all DB queries), `auth.ts` (JWT/sessions), `sql.ts` (query wrapper), `types.ts` (TypeScript interfaces), `date-utils.ts` (Hijri calendar), `validation.ts`
- `/db/migrations/` — Sequential SQL migration files

### Data Model

```
users → plans (per year) → sections → tasks
                                        ↓
                         checkins (task × day_number → done)
                         task_schedules (task + day + time + duration)
```

Progress calculation happens **server-side via PostgreSQL aggregation**, not in JavaScript.

### Auth Flow

JWT tokens (HS256, 30-day expiry) stored in httpOnly session cookies. `middleware.ts` validates sessions and protects all `/api/*` routes. Use `getSessionFromCookies()` from `lib/auth.ts` in API routes to get the current user.

### Component Patterns

- **planner-client.tsx** is the main client component — it holds drag-and-drop state (via `@hello-pangea/dnd`) and orchestrates all modals
- **SWR** manages server state; after mutations call `mutate()` to revalidate
- Modals use `ConfirmModal` to guard unsaved changes; check existing modals before adding new ones
- Forms are often multi-step (e.g., `create-task-modal.tsx` has a scheduling step)

### API Conventions

- All routes return JSON with consistent error shapes via `badRequest()` helper
- Ownership is verified server-side for every data mutation (user cannot access other users' data)
- Reorder endpoints (`/api/tasks/reorder`, `/api/sections/reorder`) use `display_order` integer column
- Recurring task scheduling uses SSE (`/api/tasks/schedule-recurring`) for progress updates

### Styling

- Tailwind CSS with `darkMode: "class"` — always include dark mode variants
- RTL layout (`dir="rtl"`) — use `rtl:` Tailwind variants where needed
- Custom fonts: `font-sans` → Tajawal, `font-serif` → Amiri (Arabic fonts)
- All user-facing text is in Arabic
