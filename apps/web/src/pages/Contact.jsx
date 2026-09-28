import { Mail, MapPin, Phone } from 'lucide-react'
import SEO from '../components/layout/SEO'
import HorizonContactForm from '../components/horizon/HorizonContactForm'
import Container from '../components/ui/Container'
import Reveal from '../components/ui/Reveal'
import { SITE } from '../lib/constants'
import { cn } from '../lib/utils'

const INFO = [
  { icon: MapPin, label: 'Location', value: SITE.location, href: null },
  { icon: Phone, label: 'Phone', value: SITE.phone, href: SITE.phoneHref },
  { icon: Mail, label: 'Email', value: SITE.email, href: SITE.emailHref },
]

export default function Contact() {
  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with WebQuokka for a free quote — call, email, or send us a message about your project."
        path="/contact"
      />

      <section className="pb-16 pt-12 sm:pb-24 sm:pt-16">
        <Container>
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-forest-600">
              Contact
            </span>
            <h1 className="mt-3 page-title font-heading">
              Let&rsquo;s build something great
            </h1>
            <p className="mt-4 text-ink-600">
              Tell us about your project and we&rsquo;ll get back to you within one business day.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.3fr] lg:gap-12">
            <div className="space-y-4">
              {INFO.map((item, i) => (
                <Reveal
                  key={item.label}
                  direction="right"
                  delay={i * 0.08}
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
                </Reveal>
              ))}

              <Reveal
                direction="right"
                delay={0.24}
                className="overflow-hidden rounded-2xl border border-cream-400"
              >
                <iframe
                  title="WebQuokka location map — Perth, Western Australia"
                  src="https://maps.google.com/maps?q=Perth%2C%20Western%20Australia&z=11&output=embed"
                  className="h-64 w-full grayscale-[20%]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </Reveal>
            </div>

            <HorizonContactForm />
          </div>
        </Container>
      </section>
    </>
  )
}
