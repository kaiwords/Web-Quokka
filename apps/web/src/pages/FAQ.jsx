import { ArrowRight } from 'lucide-react'
import { useRef } from 'react'
import SEO from '../components/layout/SEO'
import AnimatedQuokka from '../components/anim/AnimatedQuokka'
import PageTurnSection from '../components/anim/PageTurnSection'
import Accordion from '../components/ui/Accordion'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import useScrollAnimations from '../hooks/useScrollAnimations'
import { floatLoop, sectionIntro } from '../lib/animation'
import { FAQS } from '../lib/constants'
import '../styles/faq.css'

/**
 * FAQ as a three-page fold journey (see ANIMATIONS.md): a lake-accented hero
 * with a giant parallax question mark and a scrubbed answer counter, the
 * accordion page, and a CTA page with a quokka sitting on the card. All
 * scroll motion comes from the documented primitives; the accordion's own
 * expand/collapse behaviour is untouched.
 */
export default function FAQ() {
  const pageRef = useRef(null)
  useScrollAnimations(pageRef, (scope) => {
    // Hero copy cascades in; the quokka sitting on the CTA card bobs gently
    // (the wrapper, so it never fights the sit variant's own entrance tween).
    // Both helpers no-op under prefers-reduced-motion.
    sectionIntro(scope.querySelector('.faq-hero'))
    floatLoop(scope.querySelector('.quokka-spot--cta'), { amplitude: 6, duration: 3.8 })
  })

  return (
    <>
      <SEO
        title="Frequently Asked Questions"
        description="Answers to common questions about timelines, pricing, ownership, hosting, and maintenance for WebQuokka projects."
        path="/faq"
      />

      <div ref={pageRef}>
        <PageTurnSection
          className="faq-hero pb-16 pt-12 sm:pb-20 sm:pt-16"
          aria-labelledby="faq-title"
        >
          <p className="faq-giant" aria-hidden="true" data-parallax="-0.25">
            ?
          </p>
          <Container className="relative max-w-3xl text-center">
            <span
              className="inline-block text-sm font-semibold uppercase tracking-wide text-lake-600"
              data-intro
            >
              FAQ
            </span>
            <h1 id="faq-title" className="mt-3 page-title font-heading" data-wipe>
              Frequently asked questions
            </h1>
            <p className="mt-4 text-ink-600" data-intro>
              Can&rsquo;t find what you&rsquo;re looking for? Get in touch and we&rsquo;ll answer
              it personally.
            </p>
            {/* Decorative tally of the answers below — the count is derived
                from FAQS itself, scrubbed up by data-count-to on scroll. */}
            <span className="faq-count" aria-hidden="true" data-intro>
              <span data-count-to={FAQS.length}>0</span>
              <small>answers below</small>
            </span>
          </Container>
        </PageTurnSection>

        <PageTurnSection className="faq-list py-6 sm:py-10" aria-label="Questions and answers">
          <Container className="max-w-3xl">
            <div data-reveal>
              <Accordion items={FAQS} />
            </div>
          </Container>
        </PageTurnSection>

        <PageTurnSection className="faq-cta pb-20 pt-24 sm:pb-24" aria-labelledby="faq-cta-title">
          <Container className="max-w-3xl">
            <div
              className="relative flex flex-col items-center gap-3 rounded-4xl border border-cream-400 bg-lake-50/70 px-8 py-9 text-center sm:py-10"
              data-reveal
            >
              <div className="quokka-spot quokka-spot--cta" aria-hidden="true">
                <AnimatedQuokka variant="sit" size={104} />
              </div>
              <h2 id="faq-cta-title" className="page-h3 font-heading">
                Still have questions?
              </h2>
              <Button to="/contact" size="lg" className="mt-1">
                Ask Us Directly
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </Container>
        </PageTurnSection>
      </div>
    </>
  )
}
