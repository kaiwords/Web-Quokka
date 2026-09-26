import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { cn } from '../../lib/utils'

export default function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(0)
  const baseId = useId()

  return (
    <div className="divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white/70 dark:divide-ink-600 dark:border-ink-600 dark:bg-ink-800/70">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        const buttonId = `${baseId}-button-${index}`
        const panelId = `${baseId}-panel-${index}`

        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-heading text-base font-semibold text-sand-900 transition-colors duration-200 hover:bg-sky-50 hover:text-sky-600 dark:text-cream-50 dark:hover:bg-sky-900/10 dark:hover:text-sky-300 sm:px-6 sm:py-4.5 sm:text-lg"
              >
                <span>{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'h-5 w-5 shrink-0 text-sky-500 transition-transform duration-300',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-sand-700 dark:text-sand-200 sm:px-6 sm:pb-5">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
