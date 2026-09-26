import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import Icon from './Icon'
import { cn } from '../../lib/utils'

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
        className="absolute left-6 top-1 bottom-1 w-0.5 bg-sand-200 dark:bg-ink-600 sm:left-8"
        aria-hidden="true"
      >
        <motion.div style={{ scaleY }} className="h-full w-full origin-top bg-sky-500" />
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
                'absolute -left-16 top-0 flex h-11 w-11 items-center justify-center rounded-full text-ink-900 shadow-lg sm:-left-20 sm:h-12 sm:w-12',
                index % 2 === 0 ? 'bg-sky-500 shadow-sky-500/30' : 'bg-flame-500 shadow-flame-500/30',
              )}
            >
              <Icon name={step.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.span>
            <h3 className="font-heading text-lg font-bold text-sand-900 dark:text-cream-50 sm:text-xl">
              {step.title}
            </h3>
            <p className="mt-1.5 max-w-xl text-sm text-sand-700 dark:text-sand-300 sm:text-base">
              {step.description}
            </p>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
