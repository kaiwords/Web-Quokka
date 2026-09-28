import { useEffect, useRef } from 'react'
import { hasFinePointer, prefersReducedMotion } from '../../lib/horizon'

const CHIPS = [
  { className: 'chip--a', depth: 1.4, text: '📍 Perth, WA' },
  { className: 'chip--b', depth: 0.9, text: '🚀 MVP to launch' },
  { className: 'chip--c', depth: 1.8, text: '🛠 Support after launch' },
]

/**
 * Decorative hero centrepiece: three rings around a quokka core, the whole thing
 * tipping toward the mouse while the floating proof chips parallax at their own
 * depths. Purely visual — hidden from assistive tech.
 */
export default function Orbit() {
  const ref = useRef(null)

  useEffect(() => {
    const orbit = ref.current
    if (!orbit || prefersReducedMotion() || !hasFinePointer()) return undefined

    const chips = Array.from(orbit.querySelectorAll('.chip'))
    let ox = 0
    let oy = 0
    let queued = false

    const onMove = (e) => {
      ox = (e.clientX / window.innerWidth - 0.5) * 2
      oy = (e.clientY / window.innerHeight - 0.5) * 2
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        orbit.style.setProperty('--ox', ox.toFixed(3))
        orbit.style.setProperty('--oy', oy.toFixed(3))
        chips.forEach((c) => {
          const d = parseFloat(c.getAttribute('data-depth')) || 1
          c.style.translate = `${(ox * d * -16).toFixed(1)}px ${(oy * d * -16).toFixed(1)}px`
        })
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div className="orbit" ref={ref} aria-hidden="true">
      <div className="orbit-inner">
        <div className="orbit-ring orbit-ring--1">
          <span className="planet planet--lime" />
        </div>
        <div className="orbit-ring orbit-ring--2">
          <span className="planet planet--orange" />
        </div>
        <div className="orbit-ring orbit-ring--3">
          <span className="planet planet--ice" />
        </div>
        <div className="orbit-core">
          <svg viewBox="0 0 40 40">
            <circle cx="12.5" cy="13" r="5" fill="#FF6B2C" />
            <circle cx="27.5" cy="13" r="5" fill="#FF6B2C" />
            <ellipse cx="20" cy="23" rx="11" ry="10" fill="#FF6B2C" />
            <ellipse cx="20" cy="26.5" rx="6" ry="4.6" fill="#FFD9C4" />
            <circle className="eye" cx="15.8" cy="21" r="1.7" fill="#0A0A0C" />
            <circle className="eye" cx="24.2" cy="21" r="1.7" fill="#0A0A0C" />
            <ellipse cx="20" cy="24.6" rx="1.8" ry="1.3" fill="#0A0A0C" />
          </svg>
        </div>
      </div>
      {CHIPS.map((chip) => (
        <span key={chip.className} className={`chip ${chip.className}`} data-depth={chip.depth}>
          {chip.text}
        </span>
      ))}
    </div>
  )
}
