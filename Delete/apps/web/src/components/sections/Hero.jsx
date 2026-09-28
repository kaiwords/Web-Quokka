import { motion } from 'motion/react'
import { ArrowRight, Compass } from 'lucide-react'
import Button from '../ui/Button'
import Container from '../ui/Container'
import FloatingShapes from '../ui/FloatingShapes'
import Icon from '../ui/Icon'
import StatCounter from '../ui/StatCounter'
import SwipeRow from '../ui/SwipeRow'
import { STATS } from '../../lib/constants'
import { cn } from '../../lib/utils'

const HEADLINE = 'From MVP to Launch — and Beyond'

const PROOF = [
  { icon: 'Rocket', title: 'MVP in weeks', detail: 'Launch-ready builds', position: 'left-4 top-4', rotate: -3, delay: 0.95, float: '0s' },
  { icon: 'LifeBuoy', title: 'We stick around', detail: 'Ongoing care plans', position: 'bottom-24 left-10', rotate: 2, delay: 1.12, float: '1.8s' },
  { icon: 'MapPin', title: 'Perth-based team', detail: 'Real people, local hours', position: 'right-4 top-14', rotate: 3, delay: 1.03, float: '0.9s' },
  { icon: 'Code2', title: 'Modern stack', detail: 'React, Tailwind, Motion', position: 'bottom-16 right-10', rotate: -2, delay: 1.2, float: '2.6s' },
]

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.1 } },
}

const word = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.2, 0.9, 0.3, 1] } },
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-14 pt-10 sm:pb-16 sm:pt-14">
      <FloatingShapes />
      <Container className="relative flex flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42 }}
          className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-sand-200 px-4 py-1.5 text-sm font-semibold text-sand-800 dark:bg-sand-800/40 dark:text-sand-200"
        >
          <Compass className="h-4 w-4" aria-hidden="true" />
          Perth&rsquo;s friendliest web team
        </motion.span>

        <motion.h1
          variants={container}
          initial="hidden"
          animate="visible"
          className="max-w-4xl text-balance font-heading text-4xl font-extrabold leading-tight text-sand-900 dark:text-cream-50 sm:text-5xl lg:text-6xl"
        >
          {HEADLINE.split(' ').map((w, i) => (
            <motion.span key={i} variants={word} className="inline-block">
              {w}
              {i !== HEADLINE.split(' ').length - 1 ? '\u00A0' : ''}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.45 }}
          className="mt-6 max-w-2xl text-balance text-lg text-sand-700 dark:text-sand-300"
        >
          WebQuokka helps Perth businesses build MVPs, custom websites, and apps that launch on
          time — then sticks around to keep them running smoothly.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.78, duration: 0.45 }}
          className="mt-8 w-full"
        >
          <SwipeRow label="Get started" dots={false} itemWidth="w-auto" className="justify-center-safe">
            <Button to="/contact" size="lg" glow>
              Start Your Project
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button to="/services" size="lg" variant="outline">
              Explore Our Services
            </Button>
          </SwipeRow>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.98, duration: 0.5 }}
          className="mt-12 grid w-full max-w-3xl grid-cols-2 gap-y-6 sm:mt-14 sm:flex sm:justify-center sm:divide-x"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse px-3 sm:px-7 lg:px-9">
              <dt className="mt-1 text-xs font-medium uppercase tracking-wide text-sand-600 dark:text-sand-400">
                {stat.label}
              </dt>
              <dd className="font-heading text-2xl font-extrabold text-sand-900 dark:text-cream-50 sm:text-3xl">
                <StatCounter value={stat.value} suffix={stat.suffix} delay={1.05} />
              </dd>
            </div>
          ))}
        </motion.dl>

        {PROOF.map((chip) => (
          <motion.div
            key={chip.title}
            initial={{ opacity: 0, y: 18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: chip.delay, duration: 0.55, ease: [0.2, 0.9, 0.3, 1] }}
            className={cn('absolute hidden xl:block', chip.position)}
          >
            <div className="animate-float" style={{ animationDelay: chip.float }}>
            <motion.div
              initial={{ rotate: chip.rotate }}
              animate={{ rotate: chip.rotate, scale: 1 }}
              whileHover={{ rotate: 0, scale: 1.04 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-white/75 py-2.5 pl-2.5 pr-4 shadow-md shadow-sand-900/5 backdrop-blur-sm dark:border-ink-600 dark:bg-ink-800/75 dark:shadow-black/20"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300">
                <Icon name={chip.icon} className="h-4.5 w-4.5" />
              </span>
              <span className="text-left">
                <span className="block text-sm font-semibold text-sand-900 dark:text-cream-50">
                  {chip.title}
                </span>
                <span className="block text-xs text-sand-600 dark:text-sand-400">{chip.detail}</span>
              </span>
            </motion.div>
            </div>
          </motion.div>
        ))}
      </Container>
    </section>
  )
}
