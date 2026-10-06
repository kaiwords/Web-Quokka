import { useEffect } from 'react'
import { ScrollTrigger, heavyMotionOK, motionOK } from '../lib/animation'

const SELECTOR = '[data-reveal], [data-wipe], [data-split]'

/**
 * The site-wide entrance system, driven by ScrollTrigger. Elements marked
 * `data-reveal` slide in, `data-wipe` headings are unmasked left to right,
 * and `data-split` titles deal their words up one by one — the transitions
 * themselves live in CSS (horizon.css) and fire when `.is-in` lands, so
 * this hook only decides *when*, batching simultaneous arrivals into a
 * stagger via the `--d` delay custom property.
 *
 * ScrollTrigger measures layout geometry rather than painted pixels, so a
 * fully clipped `data-wipe` heading triggers directly — no parent-watching
 * workaround needed.
 *
 * Runs once and keeps watching the document, so lazily loaded routes are
 * picked up without re-mounting anything. Reduced motion (or no JS-driven
 * scroll) shows everything immediately.
 */
export default function useReveals() {
  useEffect(() => {
    if (!motionOK()) {
      const showAll = () =>
        document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add('is-in'))
      showAll()
      const mo = new MutationObserver(showAll)
      mo.observe(document.body, { childList: true, subtree: true })
      return () => mo.disconnect()
    }

    const seen = new WeakSet()

    // Touch: IntersectionObserver instead of ScrollTrigger.
    //
    // ScrollTrigger re-evaluates every trigger it owns on every scroll tick.
    // That is unnoticeable while reading, but a fling to the bottom of the
    // page crosses dozens of elements in a few hundred milliseconds, and the
    // whole set is processed in that burst — which is exactly when the stutter
    // shows up. IntersectionObserver is the browser's own primitive: it costs
    // nothing per frame and reports asynchronously, so a fast scroll stays on
    // the compositor. The reveal itself is a CSS transition either way, so
    // this changes when `.is-in` lands, not how anything looks.
    if (!heavyMotionOK()) {
      const io = new IntersectionObserver(
        (entries) => {
          let i = 0
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            const el = entry.target
            if (!el.hasAttribute('data-wipe')) {
              el.style.setProperty('--d', `${(Math.min(i, 6) * 0.08).toFixed(2)}s`)
              i += 1
            }
            el.classList.add('is-in')
            io.unobserve(el)
          })
        },
        { rootMargin: '0px 0px -10% 0px' },
      )

      const watch = () => {
        document.querySelectorAll(SELECTOR).forEach((el) => {
          if (seen.has(el) || el.classList.contains('is-in')) return
          seen.add(el)
          if (el.hasAttribute('data-reveal')) {
            el.style.setProperty('--dir', Math.random() < 0.5 ? '-1' : '1')
          }
          io.observe(el)
        })
      }

      watch()
      const moTouch = new MutationObserver(watch)
      moTouch.observe(document.body, { childList: true, subtree: true })
      return () => {
        moTouch.disconnect()
        io.disconnect()
      }
    }

    const triggers = []

    function scan() {
      const fresh = []
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (seen.has(el) || el.classList.contains('is-in')) return
        seen.add(el)
        // Reveals arrive from alternating sides so a column of cards doesn't
        // read like a single conveyor belt.
        if (el.hasAttribute('data-reveal')) {
          el.style.setProperty('--dir', Math.random() < 0.5 ? '-1' : '1')
        }
        fresh.push(el)
      })
      if (!fresh.length) return
      triggers.push(
        ...ScrollTrigger.batch(fresh, {
          start: 'top 88%',
          once: true,
          onEnter: (els) => {
            els.forEach((el, i) => {
              if (!el.hasAttribute('data-wipe')) {
                el.style.setProperty('--d', `${(Math.min(i, 6) * 0.08).toFixed(2)}s`)
              }
              el.classList.add('is-in')
            })
          },
        }),
      )
    }

    scan()
    let queued = false
    const mo = new MutationObserver(() => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        scan()
        ScrollTrigger.refresh()
      })
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      triggers.forEach((t) => t.kill())
    }
  }, [])
}
