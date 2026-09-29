/* Registry for the one Lenis instance `SmoothScroll` owns, so anything that
   needs to scroll programmatically (rewind FAB, anchor links, deep links)
   rides the same easing — and falls back to native scrolling when Lenis is
   not running (reduced motion). */

let lenis = null

export function registerLenis(instance) {
  lenis = instance
}

/** Pixels the top of a scrolled-to target should clear (the floating header).
 *  Read from the CSS `scroll-padding-top` so there is one source of truth. */
export function scrollOffset() {
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
  return Number.isNaN(pad) ? 96 : pad
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0)
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function scrollToEl(el) {
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: -scrollOffset() })
  else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
