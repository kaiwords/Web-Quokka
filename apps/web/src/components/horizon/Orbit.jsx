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
          <span className="planet planet--sun" />
        </div>
        <div className="orbit-ring orbit-ring--2">
          <span className="planet planet--sage" />
        </div>
        <div className="orbit-ring orbit-ring--3">
          <span className="planet planet--forest" />
        </div>
        <div className="orbit-core">
          {/* Sandy fur with dark features, so the face reads instead of a
              solid dark-brown mass — and the famous quokka smile. */}
          <svg viewBox="0 0 40 40">
            <circle cx="12.5" cy="13" r="5" fill="#8A6244" stroke="#6B5646" strokeWidth="0.5" />
            <circle cx="27.5" cy="13" r="5" fill="#8A6244" stroke="#6B5646" strokeWidth="0.5" />
            <circle cx="12.5" cy="13.6" r="2.4" fill="#D9A08C" />
            <circle cx="27.5" cy="13.6" r="2.4" fill="#D9A08C" />
            <ellipse cx="20" cy="23" rx="11" ry="10" fill="#A9855D" stroke="#6B5646" strokeWidth="0.5" />
            <ellipse cx="20" cy="26.5" rx="6" ry="4.6" fill="#F7F1E6" />
            <circle className="eye" cx="15.8" cy="21" r="1.7" fill="#241608" />
            <circle className="eye" cx="24.2" cy="21" r="1.7" fill="#241608" />
            <ellipse cx="20" cy="24.6" rx="1.8" ry="1.3" fill="#422B1C" />
            <path d="M17.4 27.4 Q20 29.8 22.6 27.4" fill="none" stroke="#422B1C" strokeWidth="1.1" strokeLinecap="round" />
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
