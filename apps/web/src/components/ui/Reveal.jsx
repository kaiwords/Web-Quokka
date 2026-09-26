import { motion } from 'motion/react'
import { useSwipeRow } from './swipeRowContext'

const DIRECTIONS = {
  up: { y: 32, x: 0 },
  down: { y: -32, x: 0 },
  left: { y: 0, x: 32 },
  right: { y: 0, x: -32 },
  none: { y: 0, x: 0 },
}

/**
 * Scroll-triggered reveal wrapper. Animates once per element (viewport.once)
 * and honours prefers-reduced-motion automatically via `motion`'s reduced-motion config in main.jsx.
 * Inside a SwipeRow on mobile it drops the stagger delay and reveals on a small
 * peek, so a card animates as soon as it is swiped in instead of sitting invisible.
 */
export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.55,
  ease = [0.22, 1, 0.36, 1],
  scale,
  className,
  as = 'div',
  amount = 0.3,
  ...props
}) {
  const { swipe } = useSwipeRow()
  const offset = DIRECTIONS[direction] || DIRECTIONS.up
  const Tag = motion[as] || motion.div

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y, scale: scale ?? 1 }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: swipe ? Math.min(amount, 0.15) : amount }}
      transition={{ duration, delay: swipe ? 0 : delay, ease }}
      {...props}
    >
      {children}
    </Tag>
  )
}
