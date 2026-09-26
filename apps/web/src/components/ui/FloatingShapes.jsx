import { motion } from 'motion/react'

const SHAPES = [
  { className: 'left-[6%] top-[18%] h-20 w-20 bg-sky-200/50 dark:bg-sky-500/10', duration: 7, delay: 0 },
  { className: 'right-[10%] top-[12%] h-28 w-28 bg-sand-300/50 dark:bg-sand-500/10', duration: 8.5, delay: 0.6 },
  { className: 'left-[16%] bottom-[10%] h-16 w-16 bg-sand-400/40 dark:bg-sand-400/10', duration: 6, delay: 1.1 },
  { className: 'right-[18%] bottom-[16%] h-24 w-24 bg-sky-300/40 dark:bg-sky-400/10', duration: 9, delay: 0.3 },
  { className: 'left-[42%] top-[6%] h-14 w-14 bg-sky-100/60 dark:bg-sky-300/10', duration: 5.5, delay: 1.6 },
]

export default function FloatingShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {SHAPES.map((shape, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-2xl ${shape.className}`}
          animate={{ y: [0, -20, 0], x: [0, 8, 0] }}
          transition={{ duration: shape.duration, delay: shape.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
