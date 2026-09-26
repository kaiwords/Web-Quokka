import { motion } from 'motion/react'
import Container from '../ui/Container'
import Icon from '../ui/Icon'
import Reveal from '../ui/Reveal'
import { WHY_CHOOSE_US } from '../../lib/constants'

export default function WhyChooseUs() {
  return (
    <section className="bg-sand-100/50 py-16 dark:bg-ink-950/50 sm:py-24">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-sand-700 dark:text-sand-300">
            Why WebQuokka
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
            A local team that sticks around
          </h2>
        </Reveal>

        <div className="mt-10 space-y-5">
          {WHY_CHOOSE_US.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -48 : 48 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.62, ease: [0.2, 0.8, 0.2, 1] }}
              className={`flex items-center gap-5 rounded-2xl border border-sand-200 bg-white/70 p-6 dark:border-ink-600 dark:bg-ink-800/70 sm:max-w-2xl ${
                i % 2 === 0 ? 'sm:mr-auto' : 'sm:ml-auto sm:flex-row-reverse sm:text-right'
              }`}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sand-200 text-sand-800 dark:bg-sand-800/40 dark:text-sand-200">
                <Icon name={item.icon} className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-sand-900 dark:text-cream-50">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-sand-700 dark:text-sand-300">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}
