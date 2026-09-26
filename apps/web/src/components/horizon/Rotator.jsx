import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../lib/horizon'

/** The audience word under the hero headline, swapping sideways every few seconds. */
export default function Rotator({ words, interval = 2800 }) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState('')
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) {
      const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval)
      return () => clearInterval(id)
    }

    const id = setInterval(() => {
      if (document.hidden) return
      setPhase('is-out')
      timeoutRef.current = setTimeout(() => {
        setIndex((i) => (i + 1) % words.length)
        setPhase('is-in-word')
      }, 340)
    }, interval)

    return () => {
      clearInterval(id)
      clearTimeout(timeoutRef.current)
    }
  }, [words.length, interval])

  return (
    <span className="rotator">
      <span className={`rotator-word ${phase}`} key={index}>
        {words[index]}
      </span>
    </span>
  )
}
