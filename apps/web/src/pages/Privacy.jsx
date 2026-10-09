import { Link } from 'react-router-dom'
import SEO from '../components/layout/SEO'
import Container from '../components/ui/Container'
import { SITE } from '../lib/constants'

const LAST_UPDATED = '10 October 2026'

const linkClass = 'font-semibold text-forest-600 underline underline-offset-2'

/**
 * Privacy policy — a plain reading page. Everything stated here mirrors what
 * the two apps actually do (see apps/management/prisma/schema.prisma and
 * src/lib/publicForms.ts); keep this in step when the data handling changes.
 */
export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="How WebQuokka collects, uses, stores and protects the personal information you share with us through our website and Client Portal."
        path="/privacy"
      />

      <section className="pb-20 pt-12 sm:pt-16" aria-labelledby="privacy-title">
        <Container className="max-w-3xl">
          <header className="text-center">
            <span className="inline-block text-sm font-semibold uppercase tracking-wide text-lake-600">
              Legal
            </span>
            <h1 id="privacy-title" className="mt-3 page-title font-heading">
              Privacy Policy
            </h1>
            <p className="mt-4 text-ink-600">Last updated {LAST_UPDATED}</p>
          </header>

          <div className="mt-12 space-y-10 text-ink-700">
            <section>
              <p>
                {SITE.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a web
                development studio based in {SITE.location}. We respect your privacy and handle
                personal information in line with the Australian Privacy Act 1988 (Cth) and the
                Australian Privacy Principles. This policy explains what we collect through our
                website and Client Portal, why we collect it, and how you can get in touch about
                it.
              </p>
            </section>

            <section aria-labelledby="privacy-collect">
              <h2 id="privacy-collect" className="page-h3 font-heading text-ink-900">
                What we collect
              </h2>
              <p className="mt-3">
                We only collect information you choose to give us, plus the small amount of
                technical data needed to keep our forms free of spam.
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5">
                <li>
                  <strong>Contact and quote forms</strong> (including the chat widget): your name,
                  email address and message, and optionally your business name, phone number, the
                  service you are interested in and your budget range.
                </li>
                <li>
                  <strong>Newsletter sign-up:</strong> your email address.
                </li>
                <li>
                  <strong>Client Portal accounts:</strong> your name, email address and a password
                  (stored only as a secure hash), together with the project details, messages,
                  documents, change requests and invoices that belong to your account.
                </li>
                <li>
                  <strong>Technical data:</strong> when you submit a public form we record the IP
                  address the request came from. This is used solely to rate-limit abuse and spam.
                </li>
              </ul>
            </section>

            <section aria-labelledby="privacy-use">
              <h2 id="privacy-use" className="page-h3 font-heading text-ink-900">
                How we use it
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>To respond to your enquiry and prepare a quote.</li>
                <li>To deliver and support the projects we are working on together.</li>
                <li>
                  To send you our newsletter, if you subscribed. Every email includes an
                  unsubscribe link.
                </li>
                <li>To send account emails such as invitations, verification and password resets.</li>
                <li>To keep our website and portal secure and to prevent misuse.</li>
              </ul>
              <p className="mt-4">
                We do not sell your personal information, and we do not use it for advertising.
              </p>
            </section>

            <section aria-labelledby="privacy-cookies">
              <h2 id="privacy-cookies" className="page-h3 font-heading text-ink-900">
                Cookies and tracking
              </h2>
              <p className="mt-3">
                Our public website does not use analytics or advertising cookies, and it does not
                track you across other sites. The Client Portal sets one essential session cookie
                when you sign in so that you stay signed in. It is not used for any other purpose.
              </p>
              <p className="mt-3">
                Our pages load fonts from Google Fonts. Your browser requests those font files
                directly from Google, which means Google receives your IP address as part of that
                request.
              </p>
            </section>

            <section aria-labelledby="privacy-share">
              <h2 id="privacy-share" className="page-h3 font-heading text-ink-900">
                Who we share it with
              </h2>
              <p className="mt-3">
                We share personal information only with the service providers that run our
                systems, and only as far as they need it to do so:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5">
                <li>
                  <strong>Vercel</strong> hosts our website and Client Portal.
                </li>
                <li>
                  <strong>Supabase</strong> hosts the database where enquiries, newsletter
                  subscriptions and portal data are stored.
                </li>
                <li>
                  <strong>Resend</strong> delivers our transactional and newsletter emails.
                </li>
              </ul>
              <p className="mt-4">
                Some of these providers store data outside Australia. We may also disclose
                information where the law requires it.
              </p>
            </section>

            <section aria-labelledby="privacy-keep">
              <h2 id="privacy-keep" className="page-h3 font-heading text-ink-900">
                How long we keep it
              </h2>
              <p className="mt-3">
                Enquiries are kept while we are in contact with you about them and for a
                reasonable period afterwards. Client Portal data is kept for as long as your
                account is active and for as long as we need it to meet our legal and accounting
                obligations. If you unsubscribe from the newsletter we keep your address only to
                make sure we do not email you again. You can ask us to delete your information at
                any time (see below).
              </p>
            </section>

            <section aria-labelledby="privacy-security">
              <h2 id="privacy-security" className="page-h3 font-heading text-ink-900">
                How we protect it
              </h2>
              <p className="mt-3">
                All traffic to our website and portal is encrypted with HTTPS. Passwords are never
                stored in plain text. Access to client data is limited to our team, and actions
                taken in the portal are logged so we can account for them.
              </p>
            </section>

            <section aria-labelledby="privacy-rights">
              <h2 id="privacy-rights" className="page-h3 font-heading text-ink-900">
                Your choices and rights
              </h2>
              <p className="mt-3">
                You can ask us to show you the personal information we hold about you, correct
                it, or delete it. You can unsubscribe from the newsletter using the link in any
                email. If you have a concern about how we have handled your information, contact
                us first and we will do our best to resolve it. You also have the right to
                complain to the Office of the Australian Information Commissioner (OAIC).
              </p>
            </section>

            <section aria-labelledby="privacy-changes">
              <h2 id="privacy-changes" className="page-h3 font-heading text-ink-900">
                Changes to this policy
              </h2>
              <p className="mt-3">
                We may update this policy from time to time. The date at the top shows when it was
                last changed, and the current version will always be available on this page.
              </p>
            </section>

            <section aria-labelledby="privacy-contact">
              <h2 id="privacy-contact" className="page-h3 font-heading text-ink-900">
                Contact us
              </h2>
              <p className="mt-3">
                Questions about privacy? Email{' '}
                <a href={SITE.emailHref} className={linkClass}>
                  {SITE.email}
                </a>{' '}
                or call{' '}
                <a href={SITE.phoneHref} className={linkClass}>
                  {SITE.phone}
                </a>
                . You can also reach us through the{' '}
                <Link to="/contact" className={linkClass}>
                  contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </Container>
      </section>
    </>
  )
}
