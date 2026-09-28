import { ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import Container from '../ui/Container'
import ProcessTimeline from '../ui/ProcessTimeline'
import Reveal from '../ui/Reveal'
import { PROCESS_STEPS } from '../../lib/constants'

export default function ProcessPreview() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
        <Reveal direction="right">
          <span className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
            How we work
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
            A clear, simple process from idea to launch
          </h2>
          <p className="mt-4 text-sand-700 dark:text-sand-300">
            No surprises, no jargon — just a straightforward path from your first message to a
            website you&rsquo;re proud of.
          </p>
          <Button to="/process" variant="outline" size="lg" className="mt-7">
            Walk Through the Process
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </Reveal>

        <ProcessTimeline steps={PROCESS_STEPS.slice(0, 4)} />
      </Container>
    </section>
  )
}
