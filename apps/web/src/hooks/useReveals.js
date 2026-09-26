import { useEffect } from 'react'
import { prefersReducedMotion } from '../lib/horizon'

const SELECTOR = '[data-reveal], [data-wipe], [data-split]'

/**
 * The site-wide entrance system. Elements marked `data-reveal` slide in
 * horizontally, `data-wipe` headings are unmasked left to right, and
 * `data-split` titles deal their words up one by one.
 *
 * A fully clipped heading never intersects anything, so wipes are triggered by
 * watching their parent instead. Items that arrive together are staggered, which
 * is what makes a panel look like it deals its content in as it slides into view.
 *
 * Runs once and keeps watching the document, so lazily loaded routes are picked
 * up without re-mounting anything.
 */
export default function useReveals() {
  useEffect(() => {
    const reduceMotion = prefersReducedMotion()

    if (reduceMotion || !('IntersectionObserver' in window)) {
      const showAll = () =>
        document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add('is-in'))
      showAll()
      const mo = new MutationObserver(showAll)
      mo.observe(document.body, { childList: true, subtree: true })
      return () => mo.disconnect()
    }

    // parent element -> the wipe heading it stands in for
    const wipeOf = new WeakMap()
    const seen = new WeakSet()

    const io = new IntersectionObserver(
      (entries) => {
        let n = 0
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = wipeOf.get(entry.target) || entry.target
          io.unobserve(entry.target)
          if (el.hasAttribute('data-wipe')) {
            el.classList.add('is-in')
            return
          }
          el.style.setProperty('--d', `${(Math.min(n++, 6) * 0.08).toFixed(2)}s`)
          el.classList.add('is-in')
        })
      },
      { threshold: 0.12, rootMargin: '0px -4% -4% 0px' },
    )

    function scan() {
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (el.classList.contains('is-in')) return
        const target = el.hasAttribute('data-wipe') ? el.parentElement : el
        if (!target || seen.has(target)) return
        seen.add(target)
        if (el.hasAttribute('data-wipe')) wipeOf.set(target, el)
        io.observe(target)
      })
    }

    scan()
    let queued = false
    const mo = new MutationObserver(() => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        scan()
      })
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      io.disconnect()
    }
  }, [])
}
