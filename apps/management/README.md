This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Two apps in one repo

This project is two things sharing one Next.js app, database, and file storage:

- **Staff CRM** (`/dashboard`, `/clients`, `/client-tickets`, ...) — internal tool for the WebQuokka team, session cookie `wq_session`.
- **Client Portal** (`/portal/...`) — self-service portal for clients' own businesses, a fully separate login/session (`wq_portal_session`) so a staff login can never grant portal access or vice versa. See `src/lib/portalAuth.ts` and the "Client Portal (Phase 1)" section of `prisma/schema.prisma`.

Set up the database and demo data, then run `npm run dev`:

```bash
npx prisma migrate dev
npx prisma db seed
```

Demo logins after seeding:

- **Staff CRM**: `quokkasupport@gmail.com` / `Admin@026`
- **Client Portal** (Owner role, business "Oceanic Real Estate"): `demo@oceanicrealestate.com.au` / `Portal@026`

The portal's phase 1 covers auth/RBAC (Owner/Manager/Viewer), projects with milestones and client approvals, support tickets, and change requests with staff-sent quotes. Invoicing/Stripe, renewals, maintenance reports, and developer suggestions are later phases. Portal invite/password-reset emails log to the server console until `RESEND_API_KEY` is set (see `.env.example` and `src/lib/mailer.ts`).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
