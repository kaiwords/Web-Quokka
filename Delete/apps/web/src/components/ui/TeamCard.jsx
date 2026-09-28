import { motion } from 'motion/react'
import { useState } from 'react'
import { cn } from '../../lib/utils'
import { useSwipeRow } from './swipeRowContext'

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
}

export default function TeamCard({ member, index = 0 }) {
  const [flipped, setFlipped] = useState(false)
  const { swipe } = useSwipeRow()

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: swipe ? 0.15 : 0.4 }}
      transition={{ duration: 0.46, delay: swipe ? 0 : index * 0.1, ease: [0.25, 0.9, 0.35, 1] }}
      className="h-64 [perspective:1000px]"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onFocus={() => setFlipped(true)}
      onBlur={() => setFlipped(false)}
      tabIndex={0}
      role="group"
      aria-label={`${member.name}, ${member.role}`}
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.45, 0, 0.2, 1] }}
      >
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-sand-200 bg-white/80 p-6 text-center dark:border-ink-600 dark:bg-ink-800/80',
            '[backface-visibility:hidden]',
          )}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 font-heading text-2xl font-bold text-sky-600 dark:bg-sky-900/30 dark:text-sky-300">
            {initials(member.name)}
          </div>
          <h3 className="mt-4 font-heading text-lg font-bold text-sand-900 dark:text-cream-50">
            {member.name}
          </h3>
          <p className="text-sm text-sky-600 dark:text-sky-300">{member.role}</p>
        </div>

        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-sky-500 p-6 text-center font-medium text-ink-900',
            '[backface-visibility:hidden] [transform:rotateY(180deg)]',
          )}
        >
          <p className="text-sm">{member.bio}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
