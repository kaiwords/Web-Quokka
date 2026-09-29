import { useRef } from 'react'
import SEO from '../components/layout/SEO'
import AnimatedQuokka from '../components/anim/AnimatedQuokka'
import PageTurnSection from '../components/anim/PageTurnSection'
import QuokkaMedia from '../components/anim/QuokkaMedia'
import Container from '../components/ui/Container'
import Icon from '../components/ui/Icon'
import QuokkaMascot from '../components/ui/QuokkaMascot'
import SwipeRow from '../components/ui/SwipeRow'
import useScrollAnimations from '../hooks/useScrollAnimations'
import { floatLoop, sectionIntro } from '../lib/animation'
import { VALUES } from '../lib/constants'
import '../styles/about.css'

/**
 * About, read as a short vertical book (see ANIMATIONS.md): a pinned "stack"
 * hero that the story slides over, then fold page-turns for the story and the
 * values band. All motion comes from the documented primitives — the fold/pin
 * from <PageTurnSection>, the cascades from data-intro/data-reveal, drift from
 * data-parallax, and the mascot life from floatLoop + <AnimatedQuokka>.
 */
export default function About() {
  const pageRef = useRef(null)
  useScrollAnimations(pageRef, (scope) => {
    // Cascade the hero copy in on arrival, and give the mascot bubble a
    // gentle idle bob. Both helpers no-op under prefers-reduced-motion.
    sectionIntro(scope.querySelector('.about-hero'))
    floatLoop(scope.querySelector('.about-mascot-float'), { amplitude: 10, duration: 4.2 })
  })

  return (
    <>
      <SEO
        title="About Us"
        description="Meet the Perth-based team behind WebQuokka and learn why we chose a quokka as our mascot."
        path="/about"
      />

      <div ref={pageRef}>
        {/* The one promoted "stack" hero across About/FAQ/Contact: it pins
            while the story section slides over it like the next page. */}
        <PageTurnSection
          mode="stack"
          className="about-hero relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-16"
          aria-labelledby="about-title"
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sage-200/60 blur-3xl"
            data-parallax="0.35"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-lake-500/15 blur-3xl"
            data-parallax="-0.25"
            aria-hidden="true"
          />

          <Container className="relative">
            <div className="mx-auto max-w-2xl text-center">
              <span
                className="inline-block text-sm font-semibold uppercase tracking-wide text-terracotta-600"
                data-intro
              >
                About Us
              </span>
              <h1 id="about-title" className="mt-3 page-title font-heading" data-wipe data-parallax="-0.12">
                A friendly team, built for Perth business
              </h1>
              <p className="mt-4 text-ink-600" data-intro>
                WebQuokka started with a simple idea: web development doesn&rsquo;t have to feel
                stressful, slow, or overpriced. We build with care, communicate clearly, and stick
                around long after launch.
              </p>
            </div>
          </Container>
        </PageTurnSection>

        <PageTurnSection className="about-story py-16 sm:py-24" aria-labelledby="about-why-title">
          <Container className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <h2 id="about-why-title" className="page-h2 font-heading" data-wipe>
                Why the quokka?
              </h2>
              <p className="mt-4 text-ink-600" data-reveal>
                Quokkas are famous for one thing above all: they look genuinely happy to see you.
                That&rsquo;s the energy we bring to every client relationship — approachable,
                upbeat, and always ready to help, even when the technical stuff gets complicated.
              </p>
              <p className="mt-4 text-ink-600" data-reveal>
                As a proudly Western Australian animal, the quokka also felt like the perfect fit
                for a Perth-born agency. Friendly on the outside, surprisingly resilient underneath
                — just like the businesses we build for.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div
                className="flex aspect-square items-center justify-center rounded-full bg-sage-200/70"
                style={{ width: 'clamp(11rem, 8rem + 14vw, 20rem)' }}
                data-reveal
              >
                <div className="about-mascot-float">
                  <QuokkaMascot size="clamp(5.5rem, 4rem + 7vw, 10rem)" />
                </div>
              </div>
              {/* Slot for REAL quokka footage (house rule: no stock or generated
                  stand-ins). It renders nothing until a src lands; the frame is
                  pre-wired for the figure-parallax pan when it does. */}
              <div className="about-media figure-parallax" data-figure-parallax>
                <QuokkaMedia src="" alt="" aspect="16 / 9" />
              </div>
            </div>
          </Container>
        </PageTurnSection>

        <PageTurnSection
          className="about-values bg-blush-100/70 py-16 sm:py-20"
          aria-labelledby="about-values-title"
        >
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="about-values-title" className="page-h2 font-heading" data-wipe>
                Our values
              </h2>
            </div>
            <div className="mt-10">
              <SwipeRow
                label="Our values"
                className="sm:grid sm:grid-cols-2 sm:gap-4 xl:grid-cols-4 xl:gap-5"
              >
                {VALUES.map((value) => (
                  <div
                    key={value.title}
                    className="value-card rounded-2xl border border-cream-400 bg-cream-50/70 p-5 text-center shadow-card lg:p-6"
                    data-reveal
                  >
                    <div className="value-icon mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-200 text-ink-900">
                      <Icon name={value.icon} className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 font-heading text-lg text-ink-900">{value.title}</h3>
                    <p className="mt-2 text-sm text-ink-600">{value.description}</p>
                  </div>
                ))}
              </SwipeRow>
            </div>
          </Container>

          <div className="quokka-spot quokka-spot--values" aria-hidden="true">
            <AnimatedQuokka variant="peek" side="right" size={100} />
          </div>
        </PageTurnSection>
      </div>
    </>
  )
}
