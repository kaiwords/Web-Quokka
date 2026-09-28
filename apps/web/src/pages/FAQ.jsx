import { ArrowRight } from 'lucide-react'
import SEO from '../components/layout/SEO'
import Accordion from '../components/ui/Accordion'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import Reveal from '../components/ui/Reveal'
import { FAQS } from '../lib/constants'

export default function FAQ() {
  return (
    <>
      <SEO
        title="Frequently Asked Questions"
        description="Answers to common questions about timelines, pricing, ownership, hosting, and maintenance for WebQuokka projects."
        path="/faq"
      />

      <section className="pb-16 pt-12 sm:pb-24 sm:pt-16">
        <Container className="max-w-3xl">
          <Reveal className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-lake-600">
              FAQ
            </span>
            <h1 className="mt-3 page-title font-heading">
              Frequently asked questions
            </h1>
            <p className="mt-4 text-ink-600">
              Can&rsquo;t find what you&rsquo;re looking for? Get in touch and we&rsquo;ll answer
              it personally.
            </p>
          </Reveal>

          <Reveal className="mt-10" delay={0.1}>
            <Accordion items={FAQS} />
          </Reveal>

          <Reveal className="mt-12 flex flex-col items-center gap-3 rounded-4xl border border-cream-400 bg-lake-50/70 px-8 py-9 text-center sm:py-10">
            <h2 className="page-h3 font-heading">Still have questions?</h2>
            <Button to="/contact" size="lg" className="mt-1">
              Ask Us Directly
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
