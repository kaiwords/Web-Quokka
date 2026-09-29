import { Mail, MapPin, Phone } from 'lucide-react'
import { useRef } from 'react'
import SEO from '../components/layout/SEO'
import AnimatedQuokka from '../components/anim/AnimatedQuokka'
import PageTurnSection from '../components/anim/PageTurnSection'
import HorizonContactForm from '../components/horizon/HorizonContactForm'
import Container from '../components/ui/Container'
import useScrollAnimations from '../hooks/useScrollAnimations'
import { sectionIntro } from '../lib/animation'
import { SITE } from '../lib/constants'
import { cn } from '../lib/utils'
import '../styles/contact.css'

const INFO = [
  { icon: MapPin, label: 'Location', value: SITE.location, href: null },
  { icon: Phone, label: 'Phone', value: SITE.phone, href: SITE.phoneHref },
  { icon: Mail, label: 'Email', value: SITE.email, href: SITE.emailHref },
]

/**
 * Contact as a two-page fold journey (see ANIMATIONS.md): a forest-accented
 * hero with a scrubbed quokka hop across its reserved bottom band, then the
 * enquiry page — info tiles and map revealing around <HorizonContactForm>,
 * whose validation and submit flow are untouched (it animates itself in via
 * its own data-reveal root).
 */
export default function Contact() {
  const pageRef = useRef(null)
  useScrollAnimations(pageRef, (scope) => {
    // Cascade the hero copy in on arrival; no-op under reduced motion.
    sectionIntro(scope.querySelector('.contact-hero'))
  })

  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with WebQuokka for a free quote — call, email, or send us a message about your project."
        path="/contact"
      />

      <div ref={pageRef}>
        <PageTurnSection className="contact-hero pt-12 sm:pt-16" aria-labelledby="contact-title">
          <Container className="relative">
            <div className="mx-auto max-w-2xl text-center">
              <span
                className="inline-block text-sm font-semibold uppercase tracking-wide text-forest-600"
                data-intro
              >
                Contact
              </span>
              <h1
                id="contact-title"
                className="mt-3 page-title font-heading"
                data-wipe
                data-parallax="-0.1"
              >
                Let&rsquo;s build something great
              </h1>
              <p className="mt-4 text-ink-600" data-intro>
                Tell us about your project and we&rsquo;ll get back to you within one business day.
              </p>
            </div>
          </Container>

          {/* Scroll-scrubbed hop across the hero's reserved bottom band —
              scrub back and forth and the quokka hops with you. It starts
              from the right and hops left, mirroring Process's hopper so
              the two journeys don't repeat. */}
          <div className="quokka-spot quokka-spot--contact" aria-hidden="true">
            <AnimatedQuokka variant="hop" side="right" size={84} />
          </div>
        </PageTurnSection>

        <PageTurnSection className="contact-body pb-16 sm:pb-24" aria-label="Send us an enquiry">
          <Container>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.3fr] lg:gap-12">
              <div className="space-y-4">
                {INFO.map((item, i) => (
                  <div
                    key={item.label}
                    data-reveal
                    className={cn(
                      'flex items-center gap-4 rounded-2xl border border-cream-400 bg-cream-50/80 p-5 shadow-card',
                      item.href && 'group'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                        ['bg-forest-50 text-forest-600', 'bg-terracotta-50 text-terracotta-600', 'bg-lake-50 text-lake-600'][i % 3],
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5',
                          item.href && 'transition-transform duration-300 group-hover:-translate-y-0.5'
                        )}
                        aria-hidden="true"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="wrap-break-word font-semibold text-ink-900 hover:text-forest-600"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="wrap-break-word font-semibold text-ink-900">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="overflow-hidden rounded-2xl border border-cream-400" data-reveal>
                  <iframe
                    title="WebQuokka location map — Perth, Western Australia"
                    src="https://maps.google.com/maps?q=Perth%2C%20Western%20Australia&z=11&output=embed"
                    className="h-64 w-full grayscale-[20%]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>

              <HorizonContactForm />
            </div>
          </Container>
        </PageTurnSection>
      </div>
    </>
  )
}
