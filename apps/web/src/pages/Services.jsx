import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import SEO from '../components/layout/SEO'
import AnimatedQuokka from '../components/anim/AnimatedQuokka'
import PageTurnSection from '../components/anim/PageTurnSection'
import SplitText from '../components/horizon/SplitText'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import ServiceCard from '../components/ui/ServiceCard'
import SwipeRow from '../components/ui/SwipeRow'
import useScrollAnimations from '../hooks/useScrollAnimations'
import { sectionIntro } from '../lib/animation'
import { SERVICES } from '../lib/constants'
import '../styles/services.css'

/**
 * Services as a vertical destination (Branch2): three chapters wrapped in
 * the book page-turn treatment, all in the default fold mode — the site's
 * one promoted "stack" hero lives on About, so the pin stays a moment
 * rather than a pattern (Phase-3 ruling). Copy is unchanged from the
 * differentiation pass.
 */
export default function Services() {
  const pageRef = useRef(null)
  useScrollAnimations(pageRef, (scope) => {
    // Cascade the CTA band's children (rise + fade) when it enters.
    sectionIntro(scope.querySelector('.svc-cta-band'))
  })

  return (
    <>
      <SEO
        title="Services"
        description="MVP development, custom business websites, e-commerce, app development, and ongoing maintenance — all from a Perth-based team."
        path="/services"
      />

      <div ref={pageRef}>
        {/* ===== 01 · HERO ===== */}
        <PageTurnSection className="svc-hero" aria-labelledby="services-title">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <span
                className="inline-block text-sm font-semibold uppercase tracking-wide text-terracotta-600"
                data-reveal
              >
                Services
              </span>
              <SplitText
                as="h1"
                id="services-title"
                className="mt-3 page-title font-heading"
                segments={[{ text: 'Everything you need, under one roof' }]}
              />
              <p className="mt-4 text-ink-600" data-reveal>
                Whether you&rsquo;re launching your first MVP or need ongoing support for an
                established site, we&rsquo;ve got you covered.
              </p>
            </div>
          </Container>
        </PageTurnSection>

        {/* ===== 02 · CATALOG ===== */}
        <PageTurnSection className="svc-catalog">
          <Container>
            <p className="giant giant--outline svc-echo" aria-hidden="true" data-parallax="-0.15">
              Services
            </p>
            <SwipeRow
              label="All services"
              className="sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6"
            >
              {SERVICES.map((service, i) => (
                <ServiceCard key={service.slug} service={service} index={i} detailed />
              ))}
            </SwipeRow>
          </Container>

          <div className="quokka-spot svc-spot--peek" aria-hidden="true">
            <AnimatedQuokka variant="peek" side="left" size={104} />
          </div>
        </PageTurnSection>

        {/* ===== 03 · CTA ===== */}
        <PageTurnSection className="pb-16 pt-2 sm:pb-24" aria-label="Not sure which service fits?">
          <Container>
            <div className="svc-cta-band mt-8 flex flex-col items-center gap-3 rounded-4xl border border-cream-400 bg-sage-200/50 px-8 py-11 text-center sm:py-12">
              <h2 className="page-h2 font-heading" data-intro>
                Not sure which service fits?
              </h2>
              <p className="max-w-xl text-ink-600" data-intro>
                Tell us a bit about your project and we&rsquo;ll recommend the right path — no
                pressure, no jargon.
              </p>
              <Button to="/contact" size="lg" className="mt-2" data-intro>
                Help Me Choose
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </Container>
        </PageTurnSection>
      </div>
    </>
  )
}
