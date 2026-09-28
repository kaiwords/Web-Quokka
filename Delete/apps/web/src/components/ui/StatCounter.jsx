import NumberFlow from '@number-flow/react'
import { motion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

export default function StatCounter({ value, suffix = '', prefix = '', delay = 0, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [ready, setReady] = useState(delay === 0)

  useEffect(() => {
    if (!inView || ready) return
    const id = setTimeout(() => setReady(true), delay * 1000)
    return () => clearTimeout(id)
  }, [inView, ready, delay])

  return (
    <motion.span ref={ref} className={className}>
      {prefix}
      <NumberFlow value={inView && ready ? value : 0} transformTiming={{ duration: 1400, easing: 'ease-out' }} />
      {suffix}
    </motion.span>
  )
}
