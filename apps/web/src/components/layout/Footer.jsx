import { Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NAV_LINKS, SERVICES, SITE } from '../../lib/constants'
import Container from '../ui/Container'
import QuokkaMascot from '../ui/QuokkaMascot'
import Reveal from '../ui/Reveal'
import NewsletterForm from '../forms/NewsletterForm'

const linkClass =
  'group relative inline-flex items-center gap-1.5 text-sm text-sand-700 transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:text-sky-600 hover:after:scale-x-100 dark:text-sand-300 dark:hover:text-sky-300'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-sand-200 bg-sand-100/60 dark:border-ink-700 dark:bg-ink-950">
      <Container className="grid grid-cols-1 gap-8 pb-12 pt-14 sm:grid-cols-2 sm:gap-10 lg:grid-cols-5 lg:gap-8">
        <Reveal className="min-w-0 sm:col-span-2 lg:col-span-2" delay={0} amount={0.15} duration={0.5}>
          <Link to="/" className="flex items-center gap-2">
            <QuokkaMascot className="h-9 w-9" />
            <span className="font-heading text-xl font-bold text-sand-900 dark:text-cream-50">
              WebQuokka
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-sand-700 dark:text-sand-300">
            Friendly, professional web development for Perth businesses — from MVP to launch, and
            everything after.
          </p>
          <div className="mt-6 max-w-sm">
            <p className="text-sm font-semibold text-sand-900 dark:text-cream-50">
              Get occasional tips & updates
            </p>
            <NewsletterForm />
          </div>
        </Reveal>

        <Reveal className="min-w-0" delay={0.06} amount={0.15} duration={0.5}>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-sand-900 dark:text-cream-50">
            Quick Links
          </h3>
          <ul className="mt-3.5 space-y-1.5">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="min-w-0" delay={0.12} amount={0.15} duration={0.5}>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-sand-900 dark:text-cream-50">
            Services
          </h3>
          <ul className="mt-3.5 space-y-1.5">
            {SERVICES.map((service) => (
              <li key={service.slug}>
                <Link to="/services" className={linkClass}>
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="min-w-0" delay={0.18} amount={0.15} duration={0.5}>
          <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-sand-900 dark:text-cream-50">
            Contact
          </h3>
          <ul className="mt-3.5 space-y-2.5 text-sm text-sand-700 dark:text-sand-300">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
              <span>{SITE.location}</span>
            </li>
            <li className="group flex items-start gap-2">
              <Phone
                className="mt-0.5 h-4 w-4 shrink-0 text-sky-500 transition-transform duration-300 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
              <a href={SITE.phoneHref} className="min-w-0 wrap-break-word hover:text-sky-600 dark:hover:text-sky-300">
                {SITE.phone}
              </a>
            </li>
            <li className="group flex items-start gap-2">
              <Mail
                className="mt-0.5 h-4 w-4 shrink-0 text-sky-500 transition-transform duration-300 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
              <a href={SITE.emailHref} className="min-w-0 wrap-break-word hover:text-sky-600 dark:hover:text-sky-300">
                {SITE.email}
              </a>
            </li>
          </ul>
        </Reveal>
      </Container>

      <div className="border-t border-sand-200 py-5 dark:border-ink-700">
        <Container className="text-xs text-sand-600 dark:text-sand-400">
          <Reveal
            direction="none"
            amount={0.4}
            duration={0.45}
            delay={0.1}
            className="flex flex-col items-center justify-between gap-2 sm:flex-row"
          >
            <p>&copy; {year} WebQuokka. All rights reserved.</p>
            <p>Built with care in Perth, Western Australia.</p>
          </Reveal>
        </Container>
      </div>
    </footer>
  )
}
