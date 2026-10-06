import { useEffect, useRef, useState } from 'react'

/**
 * A frame-rate probe for diagnosing device-specific jank, opened with
 * `?perf=1`. It is not mounted at all without that flag, so normal visitors
 * never load or run it.
 *
 * It exists because the expensive work here is GPU painting, which only shows
 * up on the device that struggles — a desktop profiler says everything is
 * fine. Each toggle disables one suspect by putting a class on <html> (see the
 * `.perf-no-*` rules in horizon.css), so the slow one can be found by
 * elimination rather than by argument: turn things off until the numbers move.
 *
 * Reads: FPS over the last second, and "slow" — frames that took longer than
 * 32ms (a dropped frame at 60Hz). Scroll for a few seconds per toggle; it is
 * the slow count that matters, not the average.
 */
const SUSPECTS = [
  { key: 'glow', label: 'Glows', hint: '3 fixed 90px-blur layers' },
  { key: 'stars', label: 'Stars', hint: 'full-screen canvas' },
  { key: 'blur', label: 'Blur', hint: 'backdrop-filter on pinned UI' },
  { key: 'shadow', label: 'Shadows', hint: 'wide box-shadow blurs' },
  { key: 'anim', label: 'Animation', hint: 'all scroll + looping motion' },
]

export default function PerfProbe() {
  const [fps, setFps] = useState(0)
  const [slow, setSlow] = useState(0)
  const [off, setOff] = useState({})
  // Timestamps are seeded inside the effect — reading the clock during render
  // is impure and would drift on every re-render.
  const box = useRef({ frames: 0, slow: 0, last: 0, t0: 0 })

  useEffect(() => {
    let raf = 0
    box.current.last = performance.now()
    box.current.t0 = box.current.last
    const tick = (now) => {
      const b = box.current
      const dt = now - b.last
      b.last = now
      b.frames += 1
      if (dt > 32) b.slow += 1
      if (now - b.t0 >= 1000) {
        setFps(Math.round((b.frames * 1000) / (now - b.t0)))
        setSlow(b.slow)
        b.frames = 0
        b.slow = 0
        b.t0 = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  function toggle(key) {
    setOff((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      document.documentElement.classList.toggle(`perf-no-${key}`, next[key])
      return next
    })
  }

  const tone = fps >= 50 ? '#3A5A40' : fps >= 35 ? '#C98B1F' : '#9A3412'

  return (
    <div className="perf-probe" role="status" aria-live="off">
      <div className="perf-probe-read">
        <strong style={{ color: tone }}>{fps} fps</strong>
        <span>{slow} slow</span>
      </div>
      <div className="perf-probe-btns">
        {SUSPECTS.map((s) => (
          <button key={s.key} type="button" title={s.hint} onClick={() => toggle(s.key)} data-on={off[s.key] ? 'off' : 'on'}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
