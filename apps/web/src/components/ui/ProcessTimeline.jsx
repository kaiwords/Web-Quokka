import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import Icon from './Icon'
import { cn } from '../../lib/utils'

/* Steps cycle through the palette's accents. Brown icon on sunshine (5.9:1);
   cream icons on forest (6.9:1), terracotta (4.0:1) and lake (4.1:1) — all
   clear of the 3:1 non-text minimum. */
const STEP_ACCENTS = [
  'bg-sunshine-500 text-ink-900 shadow-sunshine-500/30',
  'bg-forest-500 text-cream-100 shadow-forest-500/30',
  'bg-terracotta-500 text-cream-100 shadow-terracotta-500/30',
  'bg-lake-500 text-cream-100 shadow-lake-500/30',
]

export default function ProcessTimeline({ steps }) {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.75', 'end 0.5'],
  })
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <div ref={containerRef} className="relative pl-16 sm:pl-20">
      <div
        className="absolute left-6 top-1 bottom-1 w-0.5 bg-cream-400 sm:left-8"
        aria-hidden="true"
      >
        <motion.div style={{ scaleY }} className="h-full w-full origin-top bg-forest-500" />
      </div>

      <ol className="space-y-10">
        {steps.map((step, index) => (
          <motion.li
            key={step.title}
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.52, ease: [0.3, 1, 0.4, 1] }}
            className="relative"
          >
            <motion.span
              initial={{ rotate: -30, scale: 0.6 }}
              whileInView={{ rotate: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.45, delay: 0.12, ease: 'backOut' }}
              className={cn(
                'absolute -left-16 top-0 flex h-11 w-11 items-center justify-center rounded-full shadow-lg sm:-left-20 sm:h-12 sm:w-12',
                STEP_ACCENTS[index % STEP_ACCENTS.length],
              )}
            >
              <Icon name={step.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.span>
            <h3 className="font-heading text-lg text-ink-900 sm:text-xl">
              {step.title}
            </h3>
            <p className="mt-1.5 max-w-xl text-sm text-ink-600 sm:text-base">
              {step.description}
            </p>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
