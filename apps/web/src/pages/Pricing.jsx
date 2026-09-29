import { useRef } from 'react'
import SEO from '../components/layout/SEO'
import AnimatedQuokka from '../components/anim/AnimatedQuokka'
import PageTurnSection from '../components/anim/PageTurnSection'
import SplitText from '../components/horizon/SplitText'
import Container from '../components/ui/Container'
import PricingCard from '../components/ui/PricingCard'
import SwipeRow from '../components/ui/SwipeRow'
import useScrollAnimations from '../hooks/useScrollAnimations'
import { floatLoop, sectionIntro } from '../lib/animation'
import { MAINTENANCE_PLANS, PROJECT_PACKAGES } from '../lib/constants'
import '../styles/pricing.css'

/** "Starting from $2,800" → { lead, amount, comma } so the at-a-glance
 *  strip can scrub-count the existing package prices (no new figures). */
function parsePrice(price) {
  const match = price.match(/\$([\d,]+)/)
  if (!match) return { amount: null }
  return {
    amount: Number(match[1].replace(/,/g, '')),
    comma: match[1].includes(','),
    lead: price.slice(0, match.index).trim(),
  }
}

/**
 * Pricing as a vertical destination (Branch2): hero, project packages and
 * maintenance plans, each closing like a book page (fold mode only — the
 * one "stack" promotion for this wave lives on Services). Copy is
 * unchanged; the glance strip re-renders lib/constants data.
 */
export default function Pricing() {
  const pageRef = useRef(null)
  useScrollAnimations(pageRef, (scope) => {
    // Rise the maintenance heading in when its chapter enters.
    sectionIntro(scope.querySelector('#pr-maintenance'))
    // Gentle bob for the glance chips, like the hero proof chips on Home.
    scope.querySelectorAll('.pr-glance li').forEach((chip, i) => {
      floatLoop(chip, { amplitude: 4, duration: 3.1 + i * 0.35 })
    })
  })

  return (
    <>
      <SEO
        title="Pricing"
        description="Transparent project packages and monthly maintenance plans for Perth businesses — starting from clear, honest prices."
        path="/pricing"
      />

      <div ref={pageRef}>
        {/* ===== 01 · HERO + at-a-glance scrub counters ===== */}
        <PageTurnSection className="pb-10 pt-12 sm:pt-16" aria-labelledby="pricing-title">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <span
                className="inline-block text-sm font-semibold uppercase tracking-wide text-forest-600"
                data-reveal
              >
                Pricing
              </span>
              <SplitText
                as="h1"
                id="pricing-title"
                className="mt-3 page-title font-heading"
                segments={[{ text: 'Simple, honest pricing' }]}
              />
              <p className="mt-4 text-ink-600" data-reveal>
                Every project is unique, so these are starting points. Get in touch for a free,
                tailored quote.
              </p>
            </div>

            {/* Visual echo of the package cards below — decorative, so it is
                hidden from assistive tech; the cards remain the real content. */}
            <ul className="pr-glance" aria-hidden="true" data-reveal>
              {PROJECT_PACKAGES.map((plan) => {
                const { amount, comma, lead } = parsePrice(plan.price)
                return (
                  <li key={plan.name}>
                    <span className="pr-glance-name">{plan.name}</span>
                    <span className="pr-glance-price">
                      {amount ? (
                        <>
                          <small>{lead}</small>
                          <span className="pr-glance-num">
                            $
                            <span
                              data-count-to={amount}
                              {...(comma ? { 'data-count-comma': '' } : null)}
                            >
                              0
                            </span>
                          </span>
                        </>
                      ) : (
                        <span className="pr-glance-num">{plan.price}</span>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Container>
        </PageTurnSection>

        {/* ===== 02 · PROJECT PACKAGES ===== */}
        <PageTurnSection className="pr-packages py-10 sm:py-14" aria-labelledby="pr-packages-title">
          <Container>
            <p className="giant giant--outline pr-echo" aria-hidden="true" data-parallax="-0.15">
              Pricing
            </p>
            <h2 id="pr-packages-title" className="text-center page-h2 font-heading" data-wipe>
              Project Packages
            </h2>
            <div className="mt-7">
              <SwipeRow
                label="Project packages"
                className="sm:grid sm:grid-cols-2 sm:gap-5 xl:grid-cols-4"
              >
                {PROJECT_PACKAGES.map((plan, i) => (
                  <PricingCard key={plan.name} plan={plan} index={i} />
                ))}
              </SwipeRow>
            </div>
          </Container>
        </PageTurnSection>

        {/* ===== 03 · MAINTENANCE PLANS + fine print ===== */}
        <PageTurnSection
          id="pr-maintenance"
          className="pr-maintenance pb-16 pt-10 sm:pb-24 sm:pt-14"
          aria-labelledby="pr-maintenance-title"
        >
          <Container>
            <h2
              id="pr-maintenance-title"
              className="text-center page-h2 font-heading"
              data-intro
            >
              Monthly Maintenance Plans
            </h2>
            <div className="mx-auto mt-7 max-w-4xl">
              <SwipeRow
                label="Monthly maintenance plans"
                className="sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
              >
                {MAINTENANCE_PLANS.map((plan, i) => (
                  <PricingCard key={plan.name} plan={plan} index={i} ctaLabel="Choose Plan" />
                ))}
              </SwipeRow>
            </div>

            <div className="pr-note mx-auto mt-10 max-w-xl" data-reveal>
              <span className="pr-note-quokka" aria-hidden="true">
                <AnimatedQuokka variant="sit" size={84} />
              </span>
              <p className="text-center text-sm text-ink-600">
                Prices shown are indicative starting points in AUD and exclude GST. Final pricing
                depends on project scope — get in touch for a tailored quote.
              </p>
            </div>
          </Container>
        </PageTurnSection>
      </div>
    </>
  )
}
