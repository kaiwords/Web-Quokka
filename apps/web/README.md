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

Forms POST JSON to `${VITE_API_BASE_URL}/contact`, `/quote`, and `/newsletter` (see `src/lib/api.js`). Without `VITE_API_BASE_URL` set, requests fall back to same-origin `/api/*` and will fail — set the env var once the real backend URL is available.

## Placeholder content

Team bios, testimonials, and package prices in `src/lib/constants.js` are placeholders and should be replaced with real content before launch. Pricing is quoted in AUD, excludes GST.

## Deployment

`vercel.json` and `firebase.json` both configure SPA rewrites (all paths → `index.html`) for client-side routing.
