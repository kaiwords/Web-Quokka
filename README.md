# WebQuokka

Two applications, one database, one repository.

```
apps/
  web/          Public marketing site  — Vite + React 19 + React Router (webquokka.com.au)
  management/   Staff CRM + client portal — Next.js 16 + Prisma + Supabase Postgres
legacy/         The pre-integration site and Express backend (not built, not committed)
```

## Why two apps

They are separate deploys on separate origins, on purpose:

- **`apps/web`** is a public, cache-friendly marketing site with no session and
  no database access. It links across to the portal and posts its forms to
  `/api/public/*`.
- **`apps/management`** owns everything behind a login: the database, all API
  routes, and both authentication systems. Every cookie-bearing request is
  same-origin to this app, so no session cookie is ever part of a cross-origin
  exchange.

## The two logins

The management app runs two fully separate trust boundaries — different tables,
different cookies, different session lookups. A staff session can never grant
portal access, or vice versa (`src/lib/auth.ts` and `src/lib/portalAuth.ts`).

| | Staff CRM | Client Portal |
|---|---|---|
| Sign in | `/login` | `/portal/login` |
| Cookie | `wq_session` | `wq_portal_session` |
| Sign up | **None — admin-created only** | `/portal/signup`, public |
| Users | `User` table | `PortalUser` table |

Staff accounts are deliberately invite-only: the CRM holds every client's data,
so public registration there would be a data breach with a signup form attached.

## Client sign-up

A visitor signing up at `/portal/signup` gets a brand-new business record of
their own — never access to an existing one. Attaching a signup to an
established business is a staff action in the CRM.

1. Sign-up creates a `Client` (`source: "SelfSignup"`, `approvedAt: null`) and
   its first `PortalUser` as Owner, status `PendingVerification`.
2. No session is issued. The account cannot log in yet.
3. They follow the emailed link → `/portal/verify-email` → status `Active`, and
   only now are they signed in.
4. Staff see the signup in the bell and approve the business record when it is
   real (`POST /api/clients/[id]/approve`).

Website contact and quote submissions land in `Enquiry`, visible at
`/enquiries` in the CRM. An enquiry is a stranger, not a client — "Convert to
client" is the explicit step that promotes one.

## Getting started

```bash
npm run install:all     # install both apps
npm run dev             # management on :3000, web on :5173
```

First-time database setup and the Supabase connection strings are in
[SETUP.md](SETUP.md).

### Scripts (repo root)

| Command | What it does |
|---|---|
| `npm run dev` | Both apps, prefixed output, either exiting stops both |
| `npm run dev:web` / `dev:management` | One app on its own |
| `npm run build` | Build both |
| `npm run typecheck` | Typecheck the management app |
| `npm run db:migrate` | Apply migrations (production) |
| `npm run db:migrate:dev` | Create + apply a migration (development) |
| `npm run db:seed` | Demo data |
| `npm run db:studio` | Browse the database |
| `npm run smoke:signup` | End-to-end check of the client sign-up flow |

## Environment

Each app has its own `.env.example` listing every variable it reads. Two of
them have to agree or forms break at runtime:

- `apps/web` → `VITE_API_BASE_URL` points at the management app's
  `/api/public`, and `VITE_MANAGEMENT_URL` at its origin.
- `apps/management` → `PUBLIC_SITE_ORIGINS` must list the marketing site's
  exact origin, or the browser blocks the form post as a CORS failure.
