# WebQuokka

Marketing site for WebQuokka, a Perth-based web development agency. React 19 + Vite, Tailwind CSS 4, and Motion for animation.

## Getting started

```bash
npm install
cp .env.example .env   # then set VITE_API_BASE_URL to the real backend
npm run dev
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## Backend integration

Forms POST JSON to `${VITE_API_BASE_URL}/contact`, `/quote`, and `/newsletter` (see `src/lib/api.js`). The localhost fallback points at the management app started by `npm run dev` at the repo root; set the env var to the deployed backend for production builds.

## Content

All copy lives in `src/lib/constants.js` and is the site's real content — there are no placeholder testimonials, stats, or team profiles. Sections like testimonials should only be (re)introduced once there are real quotes to show. Pricing is quoted in AUD, excludes GST.

## Deployment

`vercel.json` configures SPA rewrites (all paths → `index.html`) for client-side routing. GitHub Pages deploys run from `.github/workflows/deploy.yml` at the repo root.
