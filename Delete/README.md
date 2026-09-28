# Delete/

Everything in this folder was moved here (never deleted) during the UI/UX
overhaul cleanup. Nothing in the live apps imports any of it — both apps build
and typecheck without this folder. Review, then remove the folder when ready.

## What's here and why

| Path | Why it's junk |
|---|---|
| `dist/` | Stale build output of a pre-integration site, committed at the repo root |
| `backend/` | Only a leftover `node_modules` from the old Express backend — no source |
| `Quokka.txt` | Stray note containing an old "secret admin key" — **rotate that key**; nothing in the codebase reads it |
| `version` | Empty file |
| `.github/App.jsx` | Stray React component sitting inside `.github/` |
| `apps/web/03-horizon-drift/`, `apps/web/horizon-drift/` | Static prototypes of the horizon design, superseded by the React app |
| `apps/web/firebase.json` | Firebase Hosting config — deploys are Vercel / GitHub Pages now |
| `apps/web/src/pages/mainframe/` + `apps/web/public/video/` | A `/mainframe` route for a different agency ("Mainframe — Creative Agency", hello@mainframe.co) — not WebQuokka |
| `apps/web/public/images/` | Quokka SVGs nothing references |
| `apps/web/src/components/sections/` | Old vertical-homepage sections, unused since the horizontal rail became the home page (includes the placeholder `Testimonials`) |
| `apps/web/src/components/forms/` | Old contact/newsletter forms — the live site uses `components/horizon/HorizonContactForm` |
| `apps/web/src/components/layout/{Header,Footer,BackToTop,PageTransition,QuickContactButton,ScrollProgressBar,SmoothScroll}.jsx` | Old layout chrome replaced by the horizon header/footer (a new Lenis-based `SmoothScroll.jsx` now lives at the old path) |
| `apps/web/src/components/ui/{CircularTestimonials,FloatingShapes,SuccessCheck,StatCounter,TeamCard}.jsx` | Only used by the removed sections / removed fake stats & team content |
| `apps/web/src/context/` | Theme toggle context — the site is dark-only |
| `apps/management/ofs/` | Empty nested folder |
| `apps/management/src/app/portal/login/` | Replaced by the unified `/login` page; the proxy 308-redirects `/portal/login` there |
| `apps/management/src/app/favicon.ico` | Default Next.js favicon, superseded by the brand mascot `icon.png` |
