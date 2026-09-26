-- Lock every table down to Prisma only.
--
-- Supabase serves an auto-generated REST API (PostgREST) over the `public`
-- schema, and grants the `anon` and `authenticated` roles access to tables
-- there. Row Level Security is the only thing standing between those roles and
-- the data — and tables created by a Prisma migration have RLS DISABLED by
-- default. Without this migration, every table below is readable and writable
-- through Supabase's REST API using the anon key, which is a public key meant
-- to ship in browser code. That includes User.passwordHash,
-- PortalUser.passwordHash, Session, PortalSession, Invoice and every client
-- record.
--
-- Enabling RLS with NO policies denies all access to those roles, because
-- PostgreSQL's default under RLS is deny. This app does not use PostgREST at
-- all: it reaches Postgres through Prisma as the table owner, and a table's
-- owner bypasses RLS, so nothing in the application changes.
--
-- FORCE is deliberately NOT used. `ALTER TABLE ... FORCE ROW LEVEL SECURITY`
-- would apply RLS to the owner as well, which would lock Prisma out of its own
-- tables.
--
-- NOTE FOR FUTURE MIGRATIONS: a new model means a new table with RLS off
-- again. Add its ENABLE line here or in a follow-up migration, or it ships
-- exposed. Supabase's dashboard flags these as "Table is public, but RLS is
-- disabled" if one is missed.
--
-- `_prisma_migrations` is left alone on purpose. It is Prisma's own bookkeeping
-- rather than application data, and it holds nothing but migration names and
-- checksums.

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChangeRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Milestone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsletterSubscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PortalEmailVerification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PortalInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PortalPasswordReset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PortalSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PortalUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectUpdate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Requirement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Suggestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Todo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
