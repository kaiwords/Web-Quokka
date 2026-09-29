import { useEffect, useRef } from 'react'

/**
 * The slim scroll-progress line along the top edge — the vertical journey's
 * replacement for the rail's chapter bar. A forest→sunshine fill scales with
 * how far down the page you are. Purely informational (it tracks position,
 * it is not decoration), so it stays on under reduced motion; the transform
 * is written directly, no transitions.
 */
export default function ScrollProgress() {
  const barRef = useRef(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return undefined
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
      bar.style.transform = `scaleX(${p.toFixed(4)})`
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="scroll-progress" aria-hidden="true">
      <span ref={barRef} />
    </div>
  )
}
