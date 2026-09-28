import { ArrowRight } from 'lucide-react'
import SEO from '../components/layout/SEO'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import IntegrationShowcase from '../components/ui/IntegrationShowcase'
import ProcessTimeline from '../components/ui/ProcessTimeline'
import Reveal from '../components/ui/Reveal'
import { PROCESS_STEPS } from '../lib/constants'

export default function Process() {
  return (
    <>
      <SEO
        title="Our Process"
        description="From discovery to deployment and beyond — here's exactly how WebQuokka takes your project from idea to launch."
        path="/process"
      />

      <section className="pb-16 pt-12 sm:pb-24 sm:pt-16">
        <Container className="max-w-4xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-lake-600">
              How we work
            </span>
            <h1 className="mt-3 page-title font-heading">
              Idea to launch, step by step
            </h1>
            <p className="mt-4 text-ink-600">
              A clear, collaborative process so you always know what&rsquo;s happening and
              what&rsquo;s next.
            </p>
          </Reveal>

          <div className="mt-14">
            <ProcessTimeline steps={PROCESS_STEPS} />
          </div>

          <Reveal className="mt-24 text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-lake-600">
              Our toolkit
            </span>
            <h2 className="mt-3 page-h2 font-heading">
              Built with a modern, integrated stack
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-600">
              Figma for design, React and Tailwind for the build, Motion for the polish, and
              AI-assisted development to move faster without cutting corners.
            </p>
            <div className="mt-8">
              <IntegrationShowcase
                title="One connected workflow"
                description="From design handoff to a live, animated site — our toolkit stays connected end to end, so nothing gets lost in translation."
              />
            </div>
          </Reveal>

          <Reveal className="mt-20 flex flex-col items-center gap-3 rounded-4xl bg-forest-700 px-8 py-12 text-center **:focus-visible:outline-sunshine-500">
            <h2 className="page-h2 font-heading text-cream-100">Ready to get started?</h2>
            <p className="max-w-xl text-cream-300">
              Book a free discovery call and let&rsquo;s map out step one for your project.
            </p>
            <Button to="/contact" size="lg" className="mt-2">
              Book a Discovery Call
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Reveal>
        </Container>
      </section>
    </>
  )
}
