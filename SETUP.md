# Setup

From a clean checkout to a running stack. Steps 2 and 3 are the only ones that
need anything from outside the repo.

## 1. Install

```bash
npm run install:all
```

## 2. Supabase connection strings

In the Supabase dashboard: **Project Settings → Database → Connection string**.

You need **two** URLs, and they are not interchangeable:

| Variable | Which one | Port | Used for |
|---|---|---|---|
| `DATABASE_URL` | Connection pooling, **Transaction** mode | 6543 | Every query the app runs |
| `DIRECT_URL` | Direct connection | 5432 | Migrations only |

Transaction pooling cannot hold the session a migration needs, which is why
Prisma is given both (`prisma/schema.prisma` reads `directUrl`). Append
`?pgbouncer=true&connection_limit=1` to `DATABASE_URL` so Prisma stops using
prepared statements, which the pooler does not support.

If the database password contains special characters, URL-encode them
(`@` → `%40`, `#` → `%23`). An un-encoded `@` silently truncates the host and
produces a confusing "can't reach database server".

```bash
cp apps/management/.env.example apps/management/.env
cp apps/web/.env.example apps/web/.env
```

Then edit `apps/management/.env` and set `DATABASE_URL` and `DIRECT_URL`.

For local development, `apps/web/.env` can stay on the defaults — the
fallbacks already point at `http://localhost:3000`.

## 3. Create the schema

```bash
npm run db:migrate      # applies prisma/migrations/0_init
npm run db:seed         # demo data (optional, but gives you a login)
```

Two migrations run:

- `0_init` — a single Postgres baseline covering every table.
- `20260926010000_enable_rls` — enables Row Level Security on all 26 tables.

The original SQLite migrations are kept for reference in
`apps/management/prisma/migrations-sqlite-archive/` and must **not** be run —
they are SQLite SQL and will fail on Postgres.

### Why the RLS migration matters

Supabase serves an auto-generated REST API over the `public` schema and grants
the `anon` and `authenticated` roles access to it. Row Level Security is the
only thing gating that — and **Prisma creates tables with RLS disabled**.

Without that second migration, every table is readable and writable through
Supabase's REST API using the anon key, which is a public key designed to ship
in browser code. That includes `User.passwordHash`, `PortalUser.passwordHash`,
`Session`, `Invoice` and every client record.

Enabling RLS with no policies denies those roles everything, because Postgres
defaults to deny under RLS. The app is unaffected: it reaches Postgres through
Prisma as the table owner, and an owner bypasses RLS.

**Adding a model later re-opens this.** A new table arrives with RLS off, so
every new model needs an `ALTER TABLE "X" ENABLE ROW LEVEL SECURITY;`. The
Supabase dashboard flags any it finds as "Table is public, but RLS is disabled".

Verify after migrating — this should return no rows:

```sql
select tablename from pg_tables
where schemaname = 'public'
  and tablename <> '_prisma_migrations'
  and not rowsecurity;
```

Verify it worked:

```bash
npm run db:studio       # should list Client, PortalUser, Enquiry, ...
```

### Logins after seeding

| | Email / username | Password |
|---|---|---|
| Staff CRM (`/login`) | `quokkasupport@gmail.com` | `Admin@026` |
| Client Portal (`/portal/login`) | `demo@oceanicrealestate.com.au` | `Portal@026` |

Change both before this is reachable from the internet.

## 4. Run

```bash
npm run dev
```

- Marketing site → http://localhost:5173
- Staff CRM → http://localhost:3000/login
- Client portal → http://localhost:3000/portal/login

## 5. Email — required before launch

Invite, password-reset and **email-confirmation** messages log to the server
console until `RESEND_API_KEY` is set (`apps/management/src/lib/mailer.ts`).

This matters more than it looks: client self-signup is gated on confirming an
address by email. Without a mail provider, a new client can sign up and then
cannot activate their account, because the link only ever appears in your
server log. Set `RESEND_API_KEY` and `MAIL_FROM` before going live.

## Production checklist

- [ ] `DATABASE_URL` / `DIRECT_URL` point at Supabase, password URL-encoded
- [ ] `RESEND_API_KEY` + `MAIL_FROM` set, and a test signup confirms end to end
- [ ] `NEXT_PUBLIC_APP_URL` is the management app's real public origin — emailed
      links are built from it, so a wrong value sends every client to a dead URL
- [ ] `PUBLIC_SITE_ORIGINS` lists the marketing site's exact origins
      (both apex and `www.` if both serve)
- [ ] `apps/web` `VITE_API_BASE_URL` and `VITE_MANAGEMENT_URL` point at the
      deployed management app
- [ ] Seeded demo passwords changed or the demo accounts deleted
- [ ] `ENQUIRY_NOTIFY_EMAIL` set if enquiries should also arrive by email
- [ ] `WEBQUOKKA_ABN` set — an Australian tax invoice must show the seller's ABN
- [ ] RLS confirmed on every table (the query above returns nothing)
- [ ] The Supabase **service role key** is never used in `apps/web` or any
      browser code — it bypasses RLS entirely

### Known limitation: rate limiting is per-instance

`src/lib/rateLimit.ts` keeps its counters in memory, which is correct for a
single instance and wrong behind several. The login, signup and public form
limits all rely on it, so if the management app is ever scaled horizontally
(or deployed to a platform that runs multiple lambdas), move it to a shared
store such as Redis. It is documented in that file too.

### Local file storage

Uploaded documents go to `apps/management/storage/uploads/<clientId>/`
(`src/lib/documents.ts`) — local disk, not Supabase Storage. On a platform with
an ephemeral filesystem, uploads will not survive a redeploy. Moving them to
Supabase Storage is a contained change to that one module.
