import { useEffect, useRef } from 'react'

/**
 * Ambient node grid for the hero background, in-brand (warm brown/sage), low
 * density for mobile perf, and fully static when prefers-reduced-motion is set.
 */
export default function ConstellationGrid() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let animationFrameId
    let width = 0
    let height = 0
    let nodes = []

    const mouse = { x: -1000, y: -1000, radius: 180 }

    const initNodes = () => {
      nodes = []
      const isSmall = width < 640
      const spacing = isSmall ? 64 : 58
      const cols = Math.ceil(width / spacing) + 1
      const rows = Math.ceil(height / spacing) + 1

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing
          const y = j * spacing
          nodes.push({
            x, y, vx: 0, vy: 0, baseX: x, baseY: y,
            radius: Math.random() * 1 + 1,
            pulse: Math.random() * Math.PI * 2,
          })
        }
      }
    }

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      initNodes()
    }

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = event.clientX - rect.left
      mouse.y = event.clientY - rect.top
    }
    const handleMouseLeave = () => { mouse.x = -1000; mouse.y = -1000 }

    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    const nodeRGB = '250, 248, 245'
    const accentRGB = '139, 158, 125'

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      const MAX_CONN = 62
      const MAX_CONN_SQ = MAX_CONN * MAX_CONN

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j]
          const dx = n.x - n2.x
          const dy = n.y - n2.y
          const distSq = dx * dx + dy * dy
          if (distSq < MAX_CONN_SQ) {
            const alpha = (1 - Math.sqrt(distSq) / MAX_CONN) * 0.14
            ctx.strokeStyle = `rgba(${nodeRGB}, ${alpha})`
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(n.x, n.y)
            ctx.lineTo(n2.x, n2.y)
            ctx.stroke()
          }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const dx = mouse.x - n.x
        const dy = mouse.y - n.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const isNear = dist < mouse.radius
        const baseAlpha = isNear ? 0.9 : 0.22 + Math.sin(n.pulse) * 0.08

        ctx.fillStyle = isNear ? `rgba(${accentRGB}, ${baseAlpha})` : `rgba(${nodeRGB}, ${baseAlpha})`
        const r = isNear ? n.radius * 2 : n.radius
        ctx.beginPath()
        ctx.arc(n.x, n.y, Math.max(0.5, r), 0, Math.PI * 2)
        ctx.fill()
      }
    }

    let lastTime = performance.now()
    const SPRING_K = 16
    const DAMPING = 0.84

    const render = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        n.pulse += dt * 2.4

        const dx = mouse.x - n.x
        const dy = mouse.y - n.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < mouse.radius && dist > 0) {
          const power = 1 - dist / mouse.radius
          const angle = Math.atan2(dy, dx)
          n.vx -= Math.cos(angle) * power * 900 * dt
          n.vy -= Math.sin(angle) * power * 900 * dt
        }

        n.vx += (n.baseX - n.x) * SPRING_K * dt
        n.vy += (n.baseY - n.y) * SPRING_K * dt
        n.vx *= DAMPING
        n.vy *= DAMPING
        n.x += n.vx * dt * 60
        n.y += n.vy * dt * 60
      }

      draw()
      animationFrameId = requestAnimationFrame(render)
    }

    if (reduceMotion) {
      draw()
    } else {
      animationFrameId = requestAnimationFrame(render)
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
}
