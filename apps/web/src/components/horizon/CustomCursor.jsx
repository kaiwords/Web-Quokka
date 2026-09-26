import { useEffect, useRef } from 'react'
import { cursorState, hasFinePointer, lerp, prefersReducedMotion } from '../../lib/horizon'

/**
 * Label cursor for fine pointers: a snappy lime dot, an eased ring that swells
 * on anything interactive, and a filled pill that spells out what a target does
 * (via `data-cursor="…"`). Hidden entirely for touch and reduced motion.
 */
export default function CustomCursor() {
  const rootRef = useRef(null)
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const labelRef = useRef(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el || !hasFinePointer() || prefersReducedMotion()) return undefined

    const dot = dotRef.current
    const ring = ringRef.current
    const label = labelRef.current
    document.documentElement.classList.add('has-cursor')

    let mx = -100
    let my = -100
    let rx = -100
    let ry = -100
    let raf = 0

    function loop() {
      rx = lerp(rx, mx, 0.18)
      ry = lerp(ry, my, 0.18)
      ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`
      raf = Math.abs(rx - mx) + Math.abs(ry - my) > 0.1 ? requestAnimationFrame(loop) : 0
    }

    const onPointerMove = (e) => {
      if (e.pointerType !== 'mouse') return
      mx = e.clientX
      my = e.clientY
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`
      el.classList.add('is-visible')
      if (!raf) raf = requestAnimationFrame(loop)
    }
    const onMouseOut = (e) => {
      if (!e.relatedTarget) el.classList.remove('is-visible')
    }
    const onDown = () => el.classList.add('is-down')
    const onUp = () => el.classList.remove('is-down')
    const onOver = (e) => {
      if (el.classList.contains('is-drag')) return
      const t = e.target.closest('[data-cursor], a, button, input, textarea, select')
      const text = t && t.getAttribute('data-cursor')
      el.classList.toggle('is-label', !!text)
      el.classList.toggle('is-hover', !!t && !text)
      el.classList.toggle('is-text', !!t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
      if (text) label.textContent = text
    }

    window.addEventListener('pointermove', onPointerMove)
    document.addEventListener('mouseout', onMouseOut)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.addEventListener('mouseover', onOver)

    cursorState.setDrag = (on) => {
      el.classList.toggle('is-drag', on)
      el.classList.toggle('is-label', on)
      if (on) label.textContent = 'Drag'
    }

    return () => {
      cursorState.setDrag = () => {}
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('mouseover', onOver)
    }
  }, [])

  return (
    <div className="cursor" ref={rootRef} aria-hidden="true">
      <div className="cursor-ring" ref={ringRef}>
        <span className="cursor-label" ref={labelRef} />
      </div>
      <div className="cursor-dot" ref={dotRef} />
    </div>
  )
}
