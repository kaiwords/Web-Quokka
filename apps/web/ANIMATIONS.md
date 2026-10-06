# WebQuokka Animation System (Branch2 foundation)

The marketing site scrolls vertically everywhere, slowed by Lenis, with
GSAP + ScrollTrigger driving all scroll-driven animation. This document is the
complete contract for Phase-2 page work: build ONLY from the primitives below.

## Ground rules

- **Transforms/opacity only.** No primitive animates layout properties, and
  none of yours should either.
- **Reduced motion is automatic.** Every primitive routes through `motionOK()`
  (`src/lib/animation.js`) and becomes a no-op with content fully visible; the
  CSS side is killed by the global `prefers-reduced-motion` block. Never call
  GSAP directly without that gate.
- **Touch gets the cheap path.** `heavyMotionOK()` is `motionOK()` minus
  coarse pointers, and it gates the two expensive things: inertia scrolling
  (`SmoothScroll` mounts no Lenis on touch, so the browser's own momentum
  scrolling is used), the scrubbed 3D fold (`initPageTurn` does nothing on
  touch — the section simply arrives), parallax, figure parallax and the
  quokka's scrubbed hop. Reveals still run on touch, but `useReveals` drives
  them from an IntersectionObserver there instead of ScrollTrigger: a fling
  crosses dozens of elements in a burst, and ScrollTrigger evaluates every
  trigger it owns on every scroll tick, so the cost scaled with scroll speed
  (slow scrolling felt fine, a fast one stuttered). Touch is also direct
  manipulation, so scroll smoothing reads as lag no matter how fast the
  device. Rule of thumb: on touch, nothing may run per scroll frame — if you
  add a primitive that scrubs, pins, or creates a ScrollTrigger per element,
  gate it on `heavyMotionOK()` or give it an IntersectionObserver path.
- **Cleanup is automatic** when you use the hook/components below — they wrap
  everything in a `gsap.context` scoped to the page and revert on unmount.
  If you hand-roll a timeline, create it inside `useScrollAnimations`'s
  `extra` callback so it joins that context.
- Lenis (`components/layout/SmoothScroll.jsx`) is mounted once at the app
  root and already synced to ScrollTrigger. **Never** mount a second Lenis,
  call `window.scrollTo` directly, or intercept wheel events — use
  `scrollToTop()` / `scrollToEl(el)` from `src/lib/scroll.js`.

## Page setup (one hook)

```jsx
import { useRef } from 'react'
import useScrollAnimations from '../hooks/useScrollAnimations'

export default function MyPage() {
  const ref = useRef(null)
  useScrollAnimations(ref)          // activates every [data-*] primitive below
  return <div ref={ref}>…sections…</div>
}
```

`useScrollAnimations(ref, extra)` — `extra(scopeEl)` is where bespoke GSAP
timelines go (they're auto-reverted). Home (`src/pages/Home.jsx`) is the
reference implementation for everything on this page.

## Primitives

### 1. `<PageTurnSection>` — book page-turn between sections

`src/components/anim/PageTurnSection.jsx`

```jsx
<PageTurnSection className="panel services" id="services" aria-labelledby="services-title">
  …section content…
</PageTurnSection>
```

- Wrap each MAJOR section of a page in one. As it scrolls out of the top of
  the viewport it closes like a notepad page — tips back around its top edge,
  lifts, takes on a settling shadow — while the next section settles flat.
- Props: `as` (tag, default `section`), `mode`:
  - `"fold"` (default) — no pinning; sections may stay transparent over the
    fixed constellation. Use this everywhere unless told otherwise.
  - `"stack"` — pins while the next section slides over it. Site-wide ruling:
    ONE stack hero exists (About); treat any further promotion as a
    coordinator decision. The section that COVERS a pinned one needs an
    opaque background AND its own stacking context
    (`position: relative; z-index: 2`) — while pinned, the hero is
    `position: fixed` and paints over static siblings without it.
    `.page-turn--stack` supplies the pinned section's own opaque ground.
- Reduced motion: plain static section.
- The shadow overlay is `.page-turn::after` driven by `--pt-shade` — don't
  repurpose that variable.

### 2. Reveal on scroll — `data-reveal`, `data-wipe`, `data-split`

Driven site-wide by `src/hooks/useReveals.js` (already mounted in App —
nothing to call). Add the attribute; CSS in `horizon.css` does the rest when
`.is-in` lands.

```jsx
<p className="panel-lead" data-reveal>…</p>   // slides in from a random side
<h2 data-wipe>…</h2>                          // unmasks left → right
```

- Simultaneous arrivals stagger automatically (80ms steps via `--d`).
- `data-split` is used by the `<SplitText>` heading component; don't add it by
  hand.

### 3. Parallax layers — `data-parallax="speed"`

```jsx
<p className="giant giant--outline" data-parallax="-0.2">Small business.</p>
```

- Scrubbed vertical drift of `speed × ~80px` across its section's viewport
  transit. Negative = drifts up. Keep `|speed| ≤ 0.5`, decorative elements
  only (never body copy).

### 4. Figure parallax — `data-figure-parallax`

```jsx
<div className="figure-parallax" data-figure-parallax>
  <img src="…" alt="…" />
</div>
```

- The media inside pans ±8% (overscaled 1.16 so no edges show) while the
  frame crosses the viewport. Works on `<QuokkaMedia data-figure-parallax>`
  too. The frame must clip (`.figure-parallax` does).

### 5. Number scrub — `data-count-to`

```jsx
<span data-count-to="2800" data-count-comma>0</span>
```

- Counts up as it scrolls into view, scrubbed (scrolling back rewinds).
  `data-count-comma` adds locale separators. Reduced motion renders the final
  number immediately. (The pricing `<Counter>` React component still exists
  and is fine — this is the attribute flavour for static markup.)

### 6. Timeline helpers — `src/lib/animation.js`

```js
import { sectionIntro, pinScene, floatLoop } from '../lib/animation'
```

- `sectionIntro(sectionEl)` — cascades the section's `[data-intro]` children
  (rise + fade, 80ms stagger) once when it enters. Markup contract: put
  `data-intro` on each child to include, in DOM order.
- `pinScene(el, (tl) => { tl.to(…) }, { distance: '+=120%', scrub: 1 })` —
  the escape hatch for bespoke pinned, scrubbed scenes. Max ~1 per page;
  returns `null` under reduced motion (so guard your assumptions).
- `floatLoop(el, { amplitude: 8 })` — gentle infinite bob for decorations.

Call all three inside `useScrollAnimations`'s `extra` callback.

### 7. `<AnimatedQuokka>` — the animated brand mascot

`src/components/anim/AnimatedQuokka.jsx` — pure SVG + GSAP, decorative
(`aria-hidden`), idle blink + ear-twitch loops built in.

```jsx
<div className="quokka-spot quokka-spot--peek" aria-hidden="true">
  <AnimatedQuokka variant="peek" side="right" size={112} />
</div>
```

- `variant="sit"` — rises in once, then idles.
- `variant="peek"` — leans in from `side` when its parent section scrolls
  into view; retreats when you scroll back above it.
- `variant="hop"` — scroll-scrubbed hop cycle across the section (hops away
  from `side`).
- Position it with a `.quokka-spot` wrapper (absolute; the parent
  `PageTurnSection` is the positioning context). `--peek` and `--hop`
  placements exist; add new `--*` spot classes in horizon.css §21 as needed.

### 8. `<QuokkaMedia>` — the slot for REAL quokka photos/video

`src/components/anim/QuokkaMedia.jsx`

```jsx
<QuokkaMedia src="/media/quokka-beach.jpg" alt="Quokka on the beach" aspect="16 / 9" />
```

- Renders a framed, rounded, elevated `<img>` (or `<video>` via
  `type="video"` / file extension) — and renders NOTHING without `src`.
- House rule: do NOT populate it with stock or generated media; it exists so
  the user can drop real quokka footage in later. Combine with
  `data-figure-parallax` for the pan treatment.

## Support pieces (owned by Phase 1 — do not rework)

- `ScrollProgress` (`components/layout/ScrollProgress.jsx`) — the top-edge
  forest→sunshine progress line, mounted at the app root.
- `Deck` / `SwipeRow` — card rows are swipe decks at every width now.
- Chat widget, header, menu, footers — untouched by animation work.

## Shared files Phase-2 agents must NOT edit

`src/lib/animation.js`, `src/lib/scroll.js`, `src/hooks/useScrollAnimations.js`,
`src/hooks/useReveals.js`, `src/components/anim/*`,
`components/layout/{SmoothScroll,ScrollProgress}.jsx`, `App.jsx`, `main.jsx`,
and horizon.css sections 7/8/21. Extend by composing, or flag a need to the
coordinator.
