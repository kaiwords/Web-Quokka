import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import SEO from '../components/layout/SEO'
import Container from '../components/ui/Container'
import Icon from '../components/ui/Icon'
import QuokkaMascot from '../components/ui/QuokkaMascot'
import Reveal from '../components/ui/Reveal'
import SwipeRow from '../components/ui/SwipeRow'
import { VALUES } from '../lib/constants'

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
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sage-200/60 blur-3xl"
          aria-hidden="true"
        />
        <motion.div
          style={{ y: shapeY }}
          className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-lake-500/15 blur-3xl"
          aria-hidden="true"
        />

        <Container className="relative">
          <motion.div style={{ y: textY }} className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-terracotta-600">
              About Us
            </span>
            <h1 className="mt-3 page-title font-heading">
              A friendly team, built for Perth business
            </h1>
            <p className="mt-4 text-ink-600">
              WebQuokka started with a simple idea: web development doesn&rsquo;t have to feel
              stressful, slow, or overpriced. We build with care, communicate clearly, and stick
              around long after launch.
            </p>
          </motion.div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal direction="right">
            <h2 className="page-h2 font-heading">Why the quokka?</h2>
            <p className="mt-4 text-ink-600">
              Quokkas are famous for one thing above all: they look genuinely happy to see you.
              That&rsquo;s the energy we bring to every client relationship — approachable,
              upbeat, and always ready to help, even when the technical stuff gets complicated.
            </p>
            <p className="mt-4 text-ink-600">
              As a proudly Western Australian animal, the quokka also felt like the perfect fit
              for a Perth-born agency. Friendly on the outside, surprisingly resilient underneath
              — just like the businesses we build for.
            </p>
          </Reveal>
          <Reveal direction="left" className="flex justify-center">
            <div
              className="flex aspect-square items-center justify-center rounded-full bg-sage-200/70"
              style={{ width: 'clamp(11rem, 8rem + 14vw, 20rem)' }}
            >
              <QuokkaMascot className="animate-float" size="clamp(5.5rem, 4rem + 7vw, 10rem)" />
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="bg-blush-100/70 py-16 sm:py-20">
        <Container>
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="page-h2 font-heading">Our values</h2>
          </Reveal>
          <div className="mt-10">
            <SwipeRow label="Our values" className="sm:grid sm:grid-cols-2 sm:gap-4 xl:grid-cols-4 xl:gap-5">
              {VALUES.map((value, i) => (
                <Reveal
                  key={value.title}
                  delay={i * 0.08}
                  className="rounded-2xl border border-cream-400 bg-cream-50/70 p-5 text-center shadow-card lg:p-6"
                >
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.55 }}
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-200 text-ink-900"
                  >
                    <Icon name={value.icon} className="h-7 w-7" />
                  </motion.div>
                  <h3 className="mt-4 font-heading text-lg text-ink-900">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-600">{value.description}</p>
                </Reveal>
              ))}
            </SwipeRow>
          </div>
        </Container>
      </section>

    </>
  )
}
