import Lenis from 'lenis'
import { useEffect } from 'react'
import { prefersReducedMotion } from '../../lib/horizon'

/**
 * Lenis-powered inertia scrolling for the vertical inner pages. Mounted by the
 * page layout only — the home rail does its own eased travel, and running both
 * would smooth the same scroll twice.
 *
 * Renders nothing; it hooks the window scroll while mounted and hands it back
 * untouched on unmount. Reduced motion opts out entirely.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    let frame
    const raf = (time) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    // In-page anchors ride the same easing instead of jumping.
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const target = document.getElementById(a.getAttribute('href').slice(1))
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target, { offset: -96 })
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  return null
}
