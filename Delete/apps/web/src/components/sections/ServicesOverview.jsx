import { ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import Container from '../ui/Container'
import Reveal from '../ui/Reveal'
import ServiceCard from '../ui/ServiceCard'
import SwipeRow from '../ui/SwipeRow'
import { SERVICES } from '../../lib/constants'

export default function ServicesOverview() {
  return (
    <section className="pb-20 pt-14 sm:pb-28 sm:pt-16">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
            What we do
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
            Everything you need to launch &amp; grow online
          </h2>
          <p className="mt-4 text-sand-700 dark:text-sand-300">
            From your very first MVP to a full-blown application, we&rsquo;ve got the Perth-based
            team to build it right.
          </p>
        </Reveal>

        <div className="mt-12">
          <SwipeRow label="Our services" className="sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {SERVICES.map((service, i) => (
              <ServiceCard key={service.slug} service={service} index={i} />
            ))}
          </SwipeRow>
        </div>

        <div className="mt-10 text-center">
          <Button to="/services" variant="secondary" size="lg">
            Browse All Services
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </Container>
    </section>
  )
}
