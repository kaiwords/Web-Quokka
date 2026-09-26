import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import SEO from '../components/layout/SEO'
import Container from '../components/ui/Container'
import Icon from '../components/ui/Icon'
import QuokkaMascot from '../components/ui/QuokkaMascot'
import Reveal from '../components/ui/Reveal'
import StatCounter from '../components/ui/StatCounter'
import SwipeRow from '../components/ui/SwipeRow'
import TeamCard from '../components/ui/TeamCard'
import { STATS, TEAM, VALUES } from '../lib/constants'

export default function About() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const shapeY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const textY = useTransform(scrollYProgress, [0, 1], [0, 40])

  return (
    <>
      <SEO
        title="About Us"
        description="Meet the Perth-based team behind WebQuokka and learn why we chose a quokka as our mascot."
        path="/about"
      />

      <section ref={heroRef} className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-16">
        <motion.div
          style={{ y: shapeY }}
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10"
          aria-hidden="true"
        />
        <motion.div
          style={{ y: shapeY }}
          className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-sand-300/40 blur-3xl dark:bg-sand-500/10"
          aria-hidden="true"
        />

        <Container className="relative">
          <motion.div style={{ y: textY }} className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
              About Us
            </span>
            <h1 className="mt-3 page-title font-heading font-bold">
              A friendly team, built for Perth business
            </h1>
            <p className="mt-4 text-sand-700 dark:text-sand-300">
              WebQuokka started with a simple idea: web development doesn&rsquo;t have to feel
              stressful, slow, or overpriced. We build with care, communicate clearly, and stick
              around long after launch.
            </p>
          </motion.div>
        </Container>
      </section>

      <section className="py-6 sm:py-8">
        <Container>
          <SwipeRow
            label="WebQuokka by the numbers"
            itemWidth="w-[44%]"
            className="sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8"
          >
            {STATS.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08} className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.42, delay: i * 0.08 + 0.1, ease: 'backOut' }}
                  className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300"
                >
                  <Icon name={stat.icon} className="h-5 w-5" />
                </motion.div>
                <p className="mt-3 page-stat font-heading font-extrabold text-sky-300">
                  <StatCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-sm text-sand-600 dark:text-sand-400">{stat.label}</p>
              </Reveal>
            ))}
          </SwipeRow>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal direction="right">
            <h2 className="page-h2 font-heading font-bold">Why the quokka?</h2>
            <p className="mt-4 text-sand-700 dark:text-sand-300">
              Quokkas are famous for one thing above all: they look genuinely happy to see you.
              That&rsquo;s the energy we bring to every client relationship — approachable,
              upbeat, and always ready to help, even when the technical stuff gets complicated.
            </p>
            <p className="mt-4 text-sand-700 dark:text-sand-300">
              As a proudly Western Australian animal, the quokka also felt like the perfect fit
              for a Perth-born agency. Friendly on the outside, surprisingly resilient underneath
              — just like the businesses we build for.
            </p>
          </Reveal>
          <Reveal direction="left" className="flex justify-center">
            <div
              className="flex aspect-square items-center justify-center rounded-full bg-sky-900/20"
              style={{ width: 'clamp(11rem, 8rem + 14vw, 20rem)' }}
            >
              <QuokkaMascot className="animate-float" size="clamp(5.5rem, 4rem + 7vw, 10rem)" />
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="bg-sand-100/50 py-16 dark:bg-ink-950/50 sm:py-20">
        <Container>
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="page-h2 font-heading font-bold">Our values</h2>
          </Reveal>
          <div className="mt-10">
            <SwipeRow label="Our values" className="sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              {VALUES.map((value, i) => (
                <Reveal
                  key={value.title}
                  delay={i * 0.08}
                  className="rounded-2xl border border-sand-200 bg-white/70 p-5 text-center dark:border-ink-600 dark:bg-ink-800/70 lg:p-6"
                >
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.55 }}
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sand-200 text-sand-800 dark:bg-sand-800/40 dark:text-sand-200"
                  >
                    <Icon name={value.icon} className="h-7 w-7" />
                  </motion.div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-sand-900 dark:text-cream-50">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm text-sand-700 dark:text-sand-300">{value.description}</p>
                </Reveal>
              ))}
            </SwipeRow>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-sand-700 dark:text-sand-300">
              Our Team
            </span>
            <h2 className="mt-3 page-h2 font-heading font-bold">
              Meet the Perth-based crew
            </h2>
            <p className="mt-4 text-sand-700 dark:text-sand-300">
              Placeholder profiles — swap in real photos and bios before launch.
            </p>
          </Reveal>
          <div className="mt-10">
            <SwipeRow label="Our team" className="sm:grid sm:grid-cols-3 sm:gap-8">
              {TEAM.map((member, i) => (
                <TeamCard key={member.name} member={member} index={i} />
              ))}
            </SwipeRow>
          </div>
        </Container>
      </section>
    </>
  )
}
