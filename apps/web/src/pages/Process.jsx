import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import SEO from '../components/layout/SEO'
import AnimatedQuokka from '../components/anim/AnimatedQuokka'
import PageTurnSection from '../components/anim/PageTurnSection'
import SplitText from '../components/horizon/SplitText'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import IntegrationShowcase from '../components/ui/IntegrationShowcase'
import ProcessTimeline from '../components/ui/ProcessTimeline'
import useScrollAnimations from '../hooks/useScrollAnimations'
import { sectionIntro } from '../lib/animation'
import { PROCESS_STEPS } from '../lib/constants'
import '../styles/process.css'

/**
 * Process as a vertical destination (Branch2): four chapters — hero,
 * the timeline (with its scroll-scrubbed fill line and a scrub-hopping
 * quokka), the toolkit showcase and the discovery-call CTA — each
 * closing like a book page (fold mode; this wave's one "stack"
 * promotion lives on Services). Copy is unchanged.
 */
export default function Process() {
  const pageRef = useRef(null)
  useScrollAnimations(pageRef, (scope) => {
    // Cascade the toolkit chapter's header when it enters.
    sectionIntro(scope.querySelector('#proc-toolkit'))
  })

  return (
    <>
      <SEO
        title="Our Process"
        description="From discovery to deployment and beyond — here's exactly how WebQuokka takes your project from idea to launch."
        path="/process"
      />

      <div ref={pageRef}>
        {/* ===== 01 · HERO ===== */}
        <PageTurnSection className="pb-8 pt-12 sm:pt-16" aria-labelledby="process-title">
          <Container className="max-w-4xl">
            <div className="mx-auto max-w-2xl text-center">
              <span
                className="inline-block text-sm font-semibold uppercase tracking-wide text-lake-600"
                data-reveal
              >
                How we work
              </span>
              <SplitText
                as="h1"
                id="process-title"
                className="mt-3 page-title font-heading"
                segments={[{ text: 'Idea to launch, step by step' }]}
              />
              <p className="mt-4 text-ink-600" data-reveal>
                A clear, collaborative process so you always know what&rsquo;s happening and
                what&rsquo;s next.
              </p>
            </div>
          </Container>
        </PageTurnSection>

        {/* ===== 02 · TIMELINE — hop quokka scrubs across the band ===== */}
        <PageTurnSection className="proc-band">
          <Container className="max-w-4xl">
            <p className="giant giant--outline proc-echo" aria-hidden="true" data-parallax="-0.15">
              Process
            </p>
            <ProcessTimeline steps={PROCESS_STEPS} />
          </Container>

          <div className="quokka-spot proc-spot--hop" aria-hidden="true">
            <AnimatedQuokka variant="hop" side="left" size={88} />
          </div>
        </PageTurnSection>

        {/* ===== 03 · TOOLKIT ===== */}
        <PageTurnSection
          id="proc-toolkit"
          className="proc-toolkit pb-6 pt-10 sm:pt-14"
          aria-labelledby="proc-toolkit-title"
        >
          <Container className="max-w-4xl">
            <div className="text-center">
              <span
                className="inline-block text-sm font-semibold uppercase tracking-wide text-lake-600"
                data-intro
              >
                Our toolkit
              </span>
              <h2 id="proc-toolkit-title" className="mt-3 page-h2 font-heading" data-intro>
                Built with a modern, integrated stack
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-ink-600" data-intro>
                Figma for design, React and Tailwind for the build, Motion for the polish, and
                AI-assisted development to move faster without cutting corners.
              </p>
              <div className="mt-8" data-reveal>
                <IntegrationShowcase
                  title="One connected workflow"
                  description="From design handoff to a live, animated site — our toolkit stays connected end to end, so nothing gets lost in translation."
                />
              </div>
            </div>
          </Container>
        </PageTurnSection>

        {/* ===== 04 · CTA ===== */}
        <PageTurnSection className="pb-16 pt-10 sm:pb-24" aria-label="Ready to get started?">
          <Container className="max-w-4xl">
            <div className="flex flex-col items-center gap-3 rounded-4xl bg-forest-700 px-8 py-12 text-center **:focus-visible:outline-sunshine-500">
              <h2 className="page-h2 font-heading text-cream-100" data-reveal>
                Ready to get started?
              </h2>
              <p className="max-w-xl text-cream-300" data-reveal>
                Book a free discovery call and let&rsquo;s map out step one for your project.
              </p>
              <Button to="/contact" size="lg" className="mt-2" data-reveal>
                Book a Discovery Call
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </Container>
        </PageTurnSection>
      </div>
    </>
  )
}
