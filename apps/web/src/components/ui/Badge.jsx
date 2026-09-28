import { motion } from 'motion/react'
import { cn } from '../../lib/utils'

export default function Badge({ className, children, tone = 'sunshine', pop = true }) {
  const tones = {
    sunshine: 'bg-sunshine-500 text-ink-900',
    forest: 'bg-forest-500 text-cream-100',
    sand: 'bg-cream-200 text-ink-900 ring-1 ring-cream-400',
  }

  const classes = cn(
    'inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide',
    tones[tone],
    className,
  )

  if (!pop) {
    return <span className={classes}>{children}</span>
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6, y: 6 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.28 }}
      className={classes}
    >
      {children}
    </motion.span>
  )
}
