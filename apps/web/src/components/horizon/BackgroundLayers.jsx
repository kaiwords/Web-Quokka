import { useEffect, useRef } from 'react'
import {
  HORIZON_COLORS,
  clamp,
  prefersReducedMotion,
  starField,
} from '../../lib/horizon'

/**
 * The full-page depth constellation behind everything: drifting colour glows, a
 * canvas of parallaxed stars that link to each other and reach for the cursor
 * (and burst when you click empty space), and a fine grain on top.
 *
 * The rail engine pushes scroll velocity in through `starField.push`, which
 * makes the stars stream past as you travel sideways.
 */
export default function BackgroundLayers() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvas.getContext) return undefined

    // Touch devices get a single static frame, like reduced-motion users.
    // The canvas covers the whole viewport, so an animated frame costs a
    // full-screen clear + redraw (plus the neighbour-linking passes over
    // every particle) — 60 times a second, the entire time someone is just
    // reading. The constellation is decorative; a still one looks the same
    // until you stare at it, and it hands those frames back to scrolling.
    const reduceMotion = prefersReducedMotion() || window.matchMedia('(pointer: coarse)').matches
    const ctx = canvas.getContext('2d')
    const LINK = 130
    const REACH = 190
    const REPEL = 90

    let W = 0
    let H = 0
    let parts = []
    let bursts = []
    const mouse = { x: 0, y: 0, active: false }
    const drift = { x: 0, y: 0 }
    let raf = 0
    let running = false

    function make(x, y, burst) {
      const a = Math.random() * Math.PI * 2
      const sp = burst ? 1.5 + Math.random() * 3 : 0.15 + Math.random() * 0.35
      return {
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        // depth: near stars move faster
        z: burst ? 1 : 0.35 + Math.random() * 0.65,
        r: 1 + Math.random() * 1.8,
        c: HORIZON_COLORS[(Math.random() * HORIZON_COLORS.length) | 0],
        life: 1,
      }
    }

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const want = clamp(Math.floor((W * H) / 13000), 30, 110)
      while (parts.length < want) parts.push(make(Math.random() * W, Math.random() * H))
      parts.length = want
    }

    function wrap(p) {
      if (p.x < -10) p.x = W + 10
      else if (p.x > W + 10) p.x = -10
      if (p.y < -10) p.y = H + 10
      else if (p.y > H + 10) p.y = -10
    }

    function frame() {
      ctx.clearRect(0, 0, W, H)
      const all = parts.concat(bursts)

      // Scroll drift eases out so stars "stream past" while travelling
      drift.x *= 0.9
      drift.y *= 0.9

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]
        p.x += p.vx - drift.x * p.z * 0.35
        p.y += p.vy - drift.y * p.z * 0.35
        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < REPEL && d > 0.01) {
            const f = ((REPEL - d) / REPEL) * 0.6
            p.vx += (dx / d) * f
            p.vy += (dy / d) * f
          }
        }
        const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (sp > 0.6) {
          p.vx *= 0.95
          p.vy *= 0.95
        }
        wrap(p)
      }
      for (let i = bursts.length - 1; i >= 0; i--) {
        const p = bursts[i]
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.96
        p.vy *= 0.96
        p.life -= 0.012
        if (p.life <= 0) bursts.splice(i, 1)
      }

      // Links between near neighbours
      ctx.lineWidth = 1
      for (let i = 0; i < all.length; i++) {
        const p = all[i]
        for (let j = i + 1; j < all.length; j++) {
          const q = all[j]
          const dx = p.x - q.x
          if (dx > LINK || dx < -LINK) continue
          const dy = p.y - q.y
          if (dy > LINK || dy < -LINK) continue
          const d2 = dx * dx + dy * dy
          if (d2 > LINK * LINK) continue
          const d = Math.sqrt(d2)
          const alpha = (1 - d / LINK) * 0.16 * Math.min(p.life, q.life)
          ctx.strokeStyle = `rgba(78,53,38,${alpha.toFixed(3)})`
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(q.x, q.y)
          ctx.stroke()
        }
      }
      // Web reaching toward the cursor
      if (mouse.active) {
        for (let i = 0; i < all.length; i++) {
          const p = all[i]
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const d2 = dx * dx + dy * dy
          if (d2 > REACH * REACH) continue
          const d = Math.sqrt(d2)
          const alpha = (1 - d / REACH) * 0.5 * p.life
          ctx.strokeStyle = `rgba(58,90,64,${alpha.toFixed(3)})`
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.stroke()
        }
      }
      // Dots
      for (let i = 0; i < all.length; i++) {
        const p = all[i]
        ctx.globalAlpha = 0.9 * p.life * (0.5 + p.z * 0.5)
        ctx.fillStyle = p.c
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * (0.6 + p.z * 0.5), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      if (running) raf = requestAnimationFrame(frame)
    }

    function start() {
      if (!running && !reduceMotion && !document.hidden) {
        running = true
        raf = requestAnimationFrame(frame)
      }
    }
    function stop() {
      running = false
      cancelAnimationFrame(raf)
    }

    size()
    if (reduceMotion) frame()
    else start()

    let resizeTimer
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        size()
        if (reduceMotion) frame()
      }, 150)
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    const onPointerMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = e.pointerType === 'mouse'
    }
    const onMouseOut = (e) => {
      if (!e.relatedTarget) mouse.active = false
    }
    // Click on empty space → burst of stars
    const onClick = (e) => {
      if (reduceMotion || e.defaultPrevented) return
      if (e.target.closest('a, button, input, select, textarea, label, .form-card, .menu')) return
      for (let k = 0; k < 14; k++) bursts.push(make(e.clientX, e.clientY, true))
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pointermove', onPointerMove)
    document.addEventListener('mouseout', onMouseOut)
    document.addEventListener('click', onClick)

    starField.push = (dx, dy) => {
      drift.x = clamp(drift.x + dx * 0.12, -30, 30)
      drift.y = clamp(drift.y + dy * 0.12, -30, 30)
    }

    return () => {
      starField.push = () => {}
      stop()
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('mouseout', onMouseOut)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <div className="bg-layers" aria-hidden="true">
      <div className="bg-glow bg-glow--sun" />
      <div className="bg-glow bg-glow--sage" />
      <div className="bg-glow bg-glow--forest" />
      <canvas className="stars" ref={canvasRef} />
      <div className="bg-grain" />
    </div>
  )
}
