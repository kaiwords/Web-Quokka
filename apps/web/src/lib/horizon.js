/* Shared primitives for the "Horizon Drift" layer: maths helpers, the media
   queries that decide whether the horizontal journey is on, and the two
   imperative effects (star drift, confetti) that are driven from outside React. */

export const HORIZON_COLORS = ['#E0A232', '#3A5A40', '#8F9D7A', '#5A4434', '#BC5B34']

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function hasFinePointer() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

/**
 * The constellation canvas registers itself here so scroll effects can push
 * velocity into it without either one importing the other.
 */
export const starField = {
  push() {},
}

/** Burst of paper from a point on screen — used when an enquiry sends. */
export function confetti(x, y) {
  if (prefersReducedMotion()) return
  let bits = []
  for (let i = 0; i < 80; i++) {
    const el = document.createElement('span')
    el.className = 'confetti'
    el.style.background = HORIZON_COLORS[i % HORIZON_COLORS.length]
    document.body.appendChild(el)
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2
    const s = 6 + Math.random() * 9
    bits.push({
      el,
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      r: Math.random() * 360,
      vr: (Math.random() - 0.5) * 22,
      life: 1,
    })
  }
  ;(function step() {
    bits = bits.filter((b) => {
      b.vy += 0.32
      b.vx *= 0.985
      b.x += b.vx
      b.y += b.vy
      b.r += b.vr
      b.life -= 0.009
      b.el.style.transform = `translate3d(${b.x}px,${b.y}px,0) rotate(${b.r}deg)`
      b.el.style.opacity = b.life
      if (b.life <= 0 || b.y > window.innerHeight + 40) {
        b.el.remove()
        return false
      }
      return true
    })
    if (bits.length) requestAnimationFrame(step)
  })()
}

/** Shared with the tilt/spotlight layer so cards stay still while the rail is dragged. */
export const dragState = { moved: false }

/** The custom cursor registers itself here so the rail's drag can switch it to "Drag". */
export const cursorState = {
  setDrag() {},
}
