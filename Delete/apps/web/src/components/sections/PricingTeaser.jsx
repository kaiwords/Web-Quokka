import { ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import Container from '../ui/Container'
import PricingCard from '../ui/PricingCard'
import Reveal from '../ui/Reveal'
import SwipeRow from '../ui/SwipeRow'
import { PROJECT_PACKAGES } from '../../lib/constants'

export default function PricingTeaser() {
  const featured = PROJECT_PACKAGES.slice(0, 3)

  return (
    <section className="bg-sand-100/50 py-20 dark:bg-ink-950/50 sm:py-28">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
            Pricing
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-sand-700 dark:text-sand-300">
            Transparent project packages with no hidden fees. Every project starts with a free,
            no-obligation quote.
          </p>
        </Reveal>

        <div className="mt-12">
          <SwipeRow label="Project packages" className="sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-7">
            {featured.map((plan, i) => (
              <PricingCard key={plan.name} plan={plan} index={i} />
            ))}
          </SwipeRow>
        </div>

        <div className="mt-10 text-center">
          <Button to="/pricing" variant="outline" size="lg">
            Compare All Packages
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </Container>
    </section>
  )
}
