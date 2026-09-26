import SEO from '../components/layout/SEO'
import Container from '../components/ui/Container'
import Reveal from '../components/ui/Reveal'
import ServiceCard from '../components/ui/ServiceCard'
import SwipeRow from '../components/ui/SwipeRow'
import Button from '../components/ui/Button'
import { SERVICES } from '../lib/constants'
import { ArrowRight } from 'lucide-react'

export default function Services() {
  return (
    <>
      <SEO
        title="Services"
        description="MVP development, custom business websites, e-commerce, app development, and ongoing maintenance — all from a Perth-based team."
        path="/services"
      />

      <section className="pb-16 pt-12 sm:pb-24 sm:pt-16">
        <Container>
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
              Services
            </span>
            <h1 className="mt-3 page-title font-heading font-bold">
              Everything you need, under one roof
            </h1>
            <p className="mt-4 text-sand-700 dark:text-sand-300">
              Whether you&rsquo;re launching your first MVP or need ongoing support for an
              established site, we&rsquo;ve got you covered.
            </p>
          </Reveal>

          <div className="mt-12">
            <SwipeRow label="All services" className="sm:grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {SERVICES.map((service, i) => (
                <ServiceCard key={service.slug} service={service} index={i} detailed />
              ))}
            </SwipeRow>
          </div>

          <Reveal className="mt-20 flex flex-col items-center gap-3 rounded-4xl border border-sand-200 bg-sand-100/60 px-8 py-11 text-center sm:py-12 dark:border-ink-600 dark:bg-ink-800/50">
            <h2 className="page-h2 font-heading font-bold">
              Not sure which service fits?
            </h2>
            <p className="max-w-xl text-sand-700 dark:text-sand-300">
              Tell us a bit about your project and we&rsquo;ll recommend the right path — no
              pressure, no jargon.
            </p>
            <Button to="/contact" size="lg" className="mt-2">
              Help Me Choose
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
