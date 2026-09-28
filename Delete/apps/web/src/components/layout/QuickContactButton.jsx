import { Mail, MessageCircleMore, Phone, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { SITE } from '../../lib/constants'

export default function QuickContactButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3 lg:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            className="flex flex-col items-end gap-3"
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
              closed: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
            }}
          >
            {[
              { href: SITE.phoneHref, icon: Phone, label: 'Call us' },
              { href: SITE.emailHref, icon: Mail, label: 'Email us' },
            ].map(({ href, icon: Icon, label }) => (
              <motion.a
                key={label}
                href={href}
                aria-label={label}
                variants={{
                  closed: { opacity: 0, y: 12, scale: 0.85 },
                  open: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { type: 'spring', stiffness: 480, damping: 26 },
                  },
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.92 }}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-sand-800 shadow-lg dark:bg-ink-800 dark:text-cream-100"
              >
                <Icon className="h-4 w-4 text-sky-500" aria-hidden="true" />
                {label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close quick contact menu' : 'Open quick contact menu'}
        aria-expanded={open}
        animate={{ scale: open ? 0.96 : 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-cream-50 shadow-xl shadow-sky-500/30"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            {open ? <X className="h-6 w-6" /> : <MessageCircleMore className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
