import { ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import Container from '../ui/Container'
import QuokkaMascot from '../ui/QuokkaMascot'
import Reveal from '../ui/Reveal'

export default function FinalCTA() {
  return (
    <section className="pb-20 pt-6 sm:pb-24 sm:pt-8">
      <Container>
        <Reveal
          scale={0.95}
          className="relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-sky-500 to-sky-600 px-8 py-14 text-center shadow-xl shadow-sky-500/20 sm:px-16 sm:py-16"
        >
          <div
            aria-hidden="true"
            className="animate-drift pointer-events-none absolute -left-10 -top-14 h-56 w-56 rounded-full bg-sand-300/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="animate-drift pointer-events-none absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-cream-50/20 blur-3xl"
            style={{ animationDelay: '4s' }}
          />
          <div className="relative">
            <QuokkaMascot tone="inverted" className="mx-auto h-14 w-14 animate-float" />
            <h2 className="mt-5 font-heading text-3xl font-bold text-cream-50 sm:text-4xl">
              Ready to build something great?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-balance text-sky-50">
              Let&rsquo;s chat about your project — no pressure, just a friendly conversation about
              what you need.
            </p>
            <div className="mt-8">
              <Button
                to="/contact"
                size="lg"
                className="bg-cream-50 text-sky-600 shadow-none hover:bg-white"
              >
                Tell Us About Your Project
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
