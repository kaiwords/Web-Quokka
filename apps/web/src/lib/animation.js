import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/* The site-wide GSAP setup and the scroll-animation primitives documented in
   apps/web/ANIMATIONS.md. Every primitive:
   - animates transform/opacity (or a CSS variable) only — never layout,
   - is a no-op under prefers-reduced-motion (content ends fully visible),
   - returns whatever it created so a caller-side gsap.context can revert it.
   Phase-2 pages should call these via `useScrollAnimations`, which wraps the
   init in a gsap.context scoped to the page and reverts it on unmount. */

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

/** One shared gate: true when motion is welcome. Checked at call time, not
 *  cached, so OS-level changes apply on the next page mount. */
export function motionOK() {
  return (
    typeof window !== 'undefined' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** True when the device can afford the *expensive* choreography — the scrubbed
 *  3D page-turn and inertia scrolling.
 *
 *  Coarse pointers are excluded deliberately, and not because phones are slow:
 *  touch is direct manipulation, so the page is expected to track the finger
 *  and stop when it stops. Heavy scroll smoothing reads as lag there, however
 *  cinematic it feels under a mouse wheel. Scrubbing two triggers per section
 *  on every touch-scroll event costs real frames on top of that. Cheap motion
 *  (reveals, parallax, the quokkas) still runs everywhere — see motionOK. */
export function heavyMotionOK() {
  return motionOK() && !window.matchMedia('(pointer: coarse)').matches
}

/* ---------- page-turn section transitions ---------- */

/**
 * The book page-turn treatment (`<PageTurnSection>` calls this).
 *
 * Default mode "fold": as a section scrolls out of the top of the viewport it
 * closes like a notepad page — tipping back around its top edge (rotateX with
 * a per-element perspective), lifting slightly, and taking on a settling
 * shadow (the `--pt-shade` overlay in horizon.css) — while the next section
 * settles flat as it arrives. No pinning, so sections may keep transparent
 * backgrounds over the fixed constellation.
 *
 * Mode "stack": the section pins (pinSpacing: false) and the next section
 * slides over it while it folds. Use for at most 1–2 hero moments per page,
 * and give the covering section an opaque background (`.page-turn--stack`).
 */
export function initPageTurn(el, { mode = 'fold' } = {}) {
  if (!el || !motionOK()) return []
  const created = []

  // Touch: one cheap entrance per section instead of the fold — no scrub, no
  // 3D layer, no pin. It ends at full opacity and starts only part-way faded,
  // so a section is readable even if its trigger never fires.
  if (!heavyMotionOK()) {
    created.push(
      gsap.fromTo(
        el,
        { y: 20, opacity: 0.75 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        },
      ),
    )
    return created
  }

  const hygiene = {
    onToggle: (self) => {
      el.style.willChange = self.isActive ? 'transform' : ''
    },
  }

  // Entrance: the incoming page settles flat.
  created.push(
    gsap.fromTo(
      el,
      { y: 48, rotateX: -5, transformPerspective: 1100, transformOrigin: '50% 100%', opacity: 0.72 },
      {
        y: 0,
        rotateX: 0,
        opacity: 1,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 55%', scrub: true, ...hygiene },
      },
    ),
  )

  // Exit: the outgoing page closes.
  const exit = gsap.timeline({
    scrollTrigger: {
      trigger: el,
      start: 'bottom 70%',
      end: 'bottom 12%',
      scrub: true,
      pin: mode === 'stack' ? el : false,
      pinSpacing: false,
      ...hygiene,
    },
  })
  exit.fromTo(
    el,
    { rotateX: 0, y: 0, scale: 1, transformPerspective: 1100, transformOrigin: '50% 0%', '--pt-shade': 0 },
    { rotateX: 7, y: -36, scale: 0.975, '--pt-shade': 0.45, ease: 'none' },
  )
  created.push(exit)

  return created
}

/* ---------- scrubbed parallax ---------- */

/**
 * `[data-parallax="speed"]` — vertical drift at `speed` × ~80px against the
 * scroll while the element's section crosses the viewport. Negative speeds
 * drift up. Decorative layers only; keep |speed| ≤ 0.5.
 */
export function initParallax(scope = document) {
  // Scrubbed: recalculates and writes a transform on every scroll frame, so
  // it is gated with the rest of the heavy motion. Headings simply sit still
  // on touch, which nobody reads as missing.
  if (!heavyMotionOK()) return []
  return Array.from(scope.querySelectorAll('[data-parallax]')).map((el) => {
    const speed = parseFloat(el.getAttribute('data-parallax')) || 0
    return gsap.fromTo(
      el,
      { y: speed * 80 },
      {
        y: speed * -80,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('section') || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    )
  })
}

/**
 * `[data-figure-parallax]` — an overflow-hidden frame whose img/video child
 * pans slowly (±8%) and stays overscaled so no edges show. Pair with the
 * `.figure-parallax` class (horizon.css) or any overflow-hidden wrapper.
 */
export function initFigureParallax(scope = document) {
  // Scrubbed, and it scales the media 1.16x to hide the drift — on touch that
  // is a permanently upscaled image repainting per frame for no payoff.
  if (!heavyMotionOK()) return []
  return Array.from(scope.querySelectorAll('[data-figure-parallax]')).flatMap((frame) => {
    const media = frame.querySelector('img, video')
    if (!media) return []
    return [
      gsap.fromTo(
        media,
        { yPercent: -8, scale: 1.16 },
        {
          yPercent: 8,
          scale: 1.16,
          ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      ),
    ]
  })
}

/* ---------- number scrub ---------- */

/**
 * `[data-count-to="2800"]` — the element's text counts up to the target as it
 * scrolls into view (scrubbed over ~45% of the viewport, so scrolling back
 * rewinds it). `data-count-comma` formats with locale separators. Reduced
 * motion writes the final number immediately.
 */
export function initCounters(scope = document) {
  return Array.from(scope.querySelectorAll('[data-count-to]')).map((el) => {
    const to = parseFloat(el.getAttribute('data-count-to')) || 0
    const comma = el.hasAttribute('data-count-comma')
    const fmt = (v) => (comma ? Math.round(v).toLocaleString('en-AU') : String(Math.round(v)))
    if (!motionOK()) {
      el.textContent = fmt(to)
      return null
    }
    const state = { v: 0 }
    return gsap.to(state, {
      v: to,
      ease: 'none',
      onUpdate: () => {
        el.textContent = fmt(state.v)
      },
      scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 45%', scrub: 0.5 },
    })
  })
}

/* ---------- timeline helpers ---------- */

/**
 * sectionIntro(section) — cascades the section's `[data-intro]` children in
 * DOM order (rise + fade, 80ms stagger) when the section enters. Plays once.
 */
export function sectionIntro(section, { start = 'top 78%' } = {}) {
  if (!section) return null
  const items = section.querySelectorAll('[data-intro]')
  if (!items.length) return null
  if (!motionOK()) return null
  return gsap.from(items, {
    y: 28,
    opacity: 0,
    duration: 0.6,
    stagger: 0.08,
    ease: 'power2.out',
    clearProps: 'transform,opacity',
    scrollTrigger: { trigger: section, start, once: true },
  })
}

/**
 * pinScene(el, build) — pins `el` for `distance` of extra scroll and hands a
 * scrubbed timeline to `build(tl)`. The Phase-2 escape hatch for bespoke
 * pinned scenes. Reduced motion: `build` is never called, nothing pins.
 */
export function pinScene(el, build, { distance = '+=120%', scrub = 1 } = {}) {
  if (!el || !motionOK()) return null
  const tl = gsap.timeline({
    scrollTrigger: { trigger: el, start: 'top top', end: distance, scrub, pin: true, anticipatePin: 1 },
  })
  build(tl)
  return tl
}

/**
 * floatLoop(el) — gentle infinite bob for decorative elements (chips, the
 * quokka, badges). Amplitude in px. Returns the tween.
 */
export function floatLoop(el, { amplitude = 8, duration = 3.2 } = {}) {
  if (!el || !motionOK()) return null
  return gsap.to(el, {
    y: -amplitude,
    duration,
    yoyo: true,
    repeat: -1,
    ease: 'sine.inOut',
  })
}

/* ---------- one-call page init ---------- */

/** Runs every attribute-driven primitive inside `scope`. `useScrollAnimations`
 *  wraps this in a gsap.context so unmount reverts everything. */
export function initScrollAnimations(scope = document) {
  initParallax(scope)
  initFigureParallax(scope)
  initCounters(scope)
}
