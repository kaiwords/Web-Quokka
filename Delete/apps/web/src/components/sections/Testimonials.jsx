import CircularTestimonials from '../ui/CircularTestimonials'
import Container from '../ui/Container'
import Reveal from '../ui/Reveal'
import { TESTIMONIALS } from '../../lib/constants'

export default function Testimonials() {
  return (
    <section className="overflow-x-clip py-16 sm:py-24">
      <Container className="max-w-5xl">
        <Reveal className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-sand-700 dark:text-sand-300">
            Testimonials
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">What clients say</h2>
        </Reveal>

        <div className="mt-10">
          <CircularTestimonials testimonials={TESTIMONIALS} autoplay />
        </div>
      </Container>
    </section>
  )
}
