import { useEffect } from 'react'
import { dragState, hasFinePointer, prefersReducedMotion } from '../lib/horizon'

/**
 * Pointer polish for the whole site, wired once via delegation so it covers
 * anything React renders later:
 *
 *   [data-magnetic]  buttons drift toward the cursor
 *   [data-tilt]      cards tip in 3D
 *   [data-spotlight] a soft lime highlight follows the cursor across a card
 *   .btn             ripples from the click point
 */
export default function useHorizonInteractions() {
  useEffect(() => {
    const reduceMotion = prefersReducedMotion()
    const fine = hasFinePointer()

    let magnet = null
    let tilter = null

    function releaseMagnet() {
      if (!magnet) return
      magnet.style.setProperty('--mx', '0px')
      magnet.style.setProperty('--my', '0px')
      magnet = null
    }

    function releaseTilt() {
      if (!tilter) return
      tilter.classList.remove('is-tilting')
      tilter.style.setProperty('--spot', 0)
      tilter.style.setProperty('--rx', '0deg')
      tilter.style.setProperty('--ry', '0deg')
      tilter = null
    }

    const onPointerMove = (e) => {
      if (e.pointerType === 'touch') return

      const nextMagnet = e.target.closest('[data-magnetic]')
      if (nextMagnet !== magnet) releaseMagnet()
      if (nextMagnet) {
        const r = nextMagnet.getBoundingClientRect()
        nextMagnet.style.setProperty('--mx', `${((e.clientX - r.left - r.width / 2) * 0.3).toFixed(1)}px`)
        nextMagnet.style.setProperty('--my', `${((e.clientY - r.top - r.height / 2) * 0.4).toFixed(1)}px`)
        magnet = nextMagnet
      }

      const nextTilt = e.target.closest('[data-tilt], [data-spotlight]')
      if (nextTilt !== tilter) releaseTilt()
      if (nextTilt && !dragState.moved) {
        const r = nextTilt.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        nextTilt.style.setProperty('--sx', `${(px * 100).toFixed(1)}%`)
        nextTilt.style.setProperty('--sy', `${(py * 100).toFixed(1)}%`)
        nextTilt.style.setProperty('--spot', 1)
        if (nextTilt.hasAttribute('data-tilt')) {
          nextTilt.classList.add('is-tilting')
          nextTilt.style.setProperty('--ry', `${((px - 0.5) * 12).toFixed(2)}deg`)
          nextTilt.style.setProperty('--rx', `${((0.5 - py) * 12).toFixed(2)}deg`)
        }
        tilter = nextTilt
      }
    }

    const onLeave = () => {
      releaseMagnet()
      releaseTilt()
    }

    const onClick = (e) => {
      const b = e.target.closest('.btn')
      if (!b || reduceMotion) return
      const r = b.getBoundingClientRect()
      const s = document.createElement('span')
      s.className = 'ripple'
      s.style.left = `${e.clientX ? e.clientX - r.left : r.width / 2}px`
      s.style.top = `${e.clientY ? e.clientY - r.top : r.height / 2}px`
      b.appendChild(s)
      setTimeout(() => s.remove(), 700)
    }

    if (fine && !reduceMotion) {
      document.addEventListener('pointermove', onPointerMove, { passive: true })
      document.addEventListener('pointerleave', onLeave)
      window.addEventListener('blur', onLeave)
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
      document.removeEventListener('click', onClick)
    }
  }, [])
}
