import Lenis from 'lenis'
import { useEffect } from 'react'
import { gsap, ScrollTrigger, motionOK } from '../../lib/animation'
import { starField } from '../../lib/horizon'
import { registerLenis, scrollOffset } from '../../lib/scroll'

/**
 * Site-wide Lenis inertia scrolling — mounted once at the app root (the home
 * rail that used to ease its own travel is gone). Tuned deliberately slow and
 * heavy so the page-turn choreography has room to read.
 *
 * It also keeps GSAP's ScrollTrigger in sync: Lenis reports scroll, GSAP's
 * ticker drives Lenis, so pinned/scrubbed scenes and the smoothing never
 * disagree about where the page is.
 *
 * Reduced motion mounts nothing — native scrolling, native anchor jumps
 * (html's scroll-padding-top keeps targets clear of the header).
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (!motionOK()) return undefined

    const lenis = new Lenis({
      lerp: 0.06,
      wheelMultiplier: 0.85,
      smoothWheel: true,
    })
    registerLenis(lenis)

    lenis.on('scroll', (e) => {
      ScrollTrigger.update()
      // The constellation streams past with the scroll velocity.
      starField.push(0, e.velocity || 0)
    })
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // In-page anchors ride the same easing instead of jumping.
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const target = document.getElementById(a.getAttribute('href').slice(1))
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target, { offset: -scrollOffset() })
    }
    document.addEventListener('click', onClick)

    // A deep link (/#pricing) should land on its section once layout settles.
    if (window.location.hash) {
      const deep = document.getElementById(window.location.hash.slice(1))
      if (deep) {
        requestAnimationFrame(() => lenis.scrollTo(deep, { offset: -scrollOffset(), immediate: true }))
      }
    }

    return () => {
      document.removeEventListener('click', onClick)
      gsap.ticker.remove(tick)
      registerLenis(null)
      lenis.destroy()
    }
  }, [])

  return null
}
