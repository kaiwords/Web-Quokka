import { useEffect, useRef, useState } from 'react'
import { clamp, prefersReducedMotion } from '../../lib/horizon'

const fmt = (n, comma) => (comma ? n.toLocaleString('en-AU') : String(n))
const format = (n, comma, decimals) => (decimals ? n.toFixed(decimals) : fmt(n, comma))

/** Counts up to `to` the first time it scrolls (or slides) into view. */
export default function Counter({ to, comma = false, decimals = 0, duration = 1600 }) {
  const ref = useRef(null)
  // Where counting up isn't wanted or possible, start at the final figure.
  const [display, setDisplay] = useState(() =>
    prefersReducedMotion() || !('IntersectionObserver' in window)
      ? format(to, comma, decimals)
      : format(0, comma, decimals),
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return undefined

    let raf = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const step = (now) => {
          const p = clamp((now - t0) / duration, 0, 1)
          const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
          const value = to * e
          setDisplay(format(decimals ? value : Math.round(value), comma, decimals))
          if (p < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.2 },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, comma, decimals, duration])

  return <span ref={ref}>{display}</span>
}
