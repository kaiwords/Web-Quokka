import { ArrowRight } from 'lucide-react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { useSwipeRow } from './swipeRowContext'

export default function ServiceCard({ service, index = 0, linkTo = '/contact', detailed = false }) {
  const { swipe } = useSwipeRow()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useMotionTemplate`${y}deg`, { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useMotionTemplate`${x}deg`, { stiffness: 300, damping: 30 })

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    x.set(px * 10)
    y.set(py * -10)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: swipe ? 0.15 : 0.3 }}
      transition={{ duration: 0.5, delay: swipe ? 0 : index * 0.07, ease: [0.25, 0.85, 0.3, 1] }}
      style={{ perspective: 800 }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="group h-full rounded-3xl border border-sand-200 bg-white/80 p-7 shadow-sm transition-shadow duration-300 hover:shadow-xl dark:border-ink-600 dark:bg-ink-800/80"
      >
        <motion.div
          whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
          transition={{ duration: 0.55 }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300"
        >
          <Icon name={service.icon} className="h-7 w-7" />
        </motion.div>

        <h3 className="mt-5 font-heading text-xl font-bold text-sand-900 dark:text-cream-50">
          {service.title}
        </h3>
        <p className="mt-2 text-sm text-sand-700 dark:text-sand-300">{service.short}</p>

        {detailed && (
          <ul className="mt-4 space-y-1.5">
            {service.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-sand-700 dark:text-sand-300">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sand-600" />
                {feature}
              </li>
            ))}
          </ul>
        )}

        <Link
          to={`${linkTo}?service=${encodeURIComponent(service.title)}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 transition-transform group-hover:translate-x-1 dark:text-sky-300"
        >
          Ask about this service
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </motion.div>
    </motion.div>
  )
}
