import { useEffect } from 'react'
import { gsap, ScrollTrigger, initScrollAnimations } from '../lib/animation'

/**
 * Runs the attribute-driven animation primitives (`[data-parallax]`,
 * `[data-figure-parallax]`, `[data-count-to]`) inside `ref`'s subtree, plus an
 * optional `extra(ctx)` callback for bespoke timelines, all inside one
 * gsap.context — so a route unmount reverts every tween and ScrollTrigger the
 * page created. This is the one hook a Phase-2 page needs.
 */
export default function useScrollAnimations(ref, extra) {
  useEffect(() => {
    const scope = ref?.current
    if (!scope) return undefined
    const ctx = gsap.context(() => {
      initScrollAnimations(scope)
      if (extra) extra(scope)
    }, scope)
    // Late layout (fonts, lazy images) shifts trigger positions.
    const refresh = () => ScrollTrigger.refresh()
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
