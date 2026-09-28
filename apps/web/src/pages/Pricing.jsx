import SEO from '../components/layout/SEO'
import Container from '../components/ui/Container'
import PricingCard from '../components/ui/PricingCard'
import Reveal from '../components/ui/Reveal'
import SwipeRow from '../components/ui/SwipeRow'
import { MAINTENANCE_PLANS, PROJECT_PACKAGES } from '../lib/constants'

export default function Pricing() {
  return (
    <>
      <SEO
        title="Pricing"
        description="Transparent project packages and monthly maintenance plans for Perth businesses — starting from clear, honest prices."
        path="/pricing"
      />

      <section className="pb-16 pt-12 sm:pb-24 sm:pt-16">
        <Container>
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
              Pricing
            </span>
            <h1 className="mt-3 page-title font-heading font-bold">
              Simple, honest pricing
            </h1>
            <p className="mt-4 text-sand-700 dark:text-sand-300">
              Every project is unique, so these are starting points. Get in touch for a free,
              tailored quote.
            </p>
          </Reveal>

          <Reveal as="h2" className="mt-14 text-center page-h2 font-heading font-bold">
            Project Packages
          </Reveal>
          <div className="mt-7">
            <SwipeRow label="Project packages" className="sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {PROJECT_PACKAGES.map((plan, i) => (
                <PricingCard key={plan.name} plan={plan} index={i} />
              ))}
            </SwipeRow>
          </div>

          <Reveal as="h2" className="mt-24 text-center page-h2 font-heading font-bold">
            Monthly Maintenance Plans
          </Reveal>
          <div className="mx-auto mt-7 max-w-4xl">
            <SwipeRow label="Monthly maintenance plans" className="sm:grid sm:grid-cols-3 sm:gap-6">
              {MAINTENANCE_PLANS.map((plan, i) => (
                <PricingCard key={plan.name} plan={plan} index={i} ctaLabel="Choose Plan" />
              ))}
            </SwipeRow>
          </div>

          <Reveal as="p" amount={0.5} duration={0.45} className="mx-auto mt-8 max-w-xl text-center text-sm text-sand-600 dark:text-sand-400">
            Prices shown are indicative starting points in AUD and exclude GST. Final pricing
            depends on project scope — get in touch for a tailored quote.
          </Reveal>
        </Container>
      </section>
    </>
  )
}
