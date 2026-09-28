import { useEffect, useRef } from 'react'
import SEO from '../components/layout/SEO'
import Btn from '../components/horizon/Btn'
import ChapterProgress from '../components/horizon/ChapterProgress'
import Counter from '../components/horizon/Counter'
import Deck from '../components/horizon/Deck'
import HorizonContactForm from '../components/horizon/HorizonContactForm'
import Orbit from '../components/horizon/Orbit'
import Rotator from '../components/horizon/Rotator'
import SplitText from '../components/horizon/SplitText'
import { useHorizon } from '../components/horizon/HorizonContext'
import NewsletterSignup from '../components/horizon/NewsletterSignup'
import Icon from '../components/ui/Icon'
import useRail from '../hooks/useRail'
import {
  PORTAL,
  PROCESS_STEPS,
  PROJECT_PACKAGES,
  SERVICES,
  SITE,
  WHY_CHOOSE_US,
} from '../lib/constants'
import { CHAPTERS } from '../lib/chapters'

const AUDIENCES = [
  'small businesses',
  'founders',
  'tradies',
  'cafés & shops',
  'clinics & studios',
  'local services',
]

const WHAT_WE_BUILD = [
  'Websites',
  'Online Stores',
  'Web Apps',
  'Mobile Apps',
  'MVPs',
  'Booking Systems',
  'Hosting',
]

/** "Starting from $2,800" → { prefix, amount, note } so the price can count up. */
function parsePrice(price) {
  const match = price.match(/\$([\d,]+)/)
  if (!match) return { amount: null, note: price }
  return {
    amount: Number(match[1].replace(/,/g, '')),
    comma: match[1].includes(','),
    note: price.replace(/\$[\d,]+/, '').trim() || 'AUD',
  }
}

export default function Home() {
  const railRef = useRef(null)
  const stickyRef = useRef(null)
  const trackRef = useRef(null)
  const { setChrome, fillRef } = useHorizon()

  useRail({ railRef, stickyRef, trackRef, fillRef, onChrome: setChrome })

  // Leaving the journey hands the header back its plain, un-travelled state.
  useEffect(() => () => setChrome({ index: 0, solid: false, away: false, horizontal: false }), [setChrome])

  return (
    <>
      <SEO
        title="Perth Web Development Agency"
        description="WebQuokka builds friendly, fast, professional websites and web apps for Perth businesses — from MVP to launch, plus ongoing maintenance and support."
        path="/"
      />

      <main id="main" className="rail" ref={railRef} tabIndex={-1}>
        <div className="rail-sticky" ref={stickyRef}>
          <div className="rail-track" ref={trackRef}>

            {/* ========== 01 · HERO ========== */}
            <section className="panel hero" id="hero" data-chapter="Start" aria-labelledby="hero-title">
              <div className="hero-copy">
                <p className="eyebrow" data-reveal>
                  <span className="pulse-dot" />
                  {SITE.locationShort} · Web studio
                </p>
                <SplitText
                  id="hero-title"
                  className="hero-title"
                  segments={[
                    { text: 'Websites that move your business' },
                    { text: 'forward.', accent: true },
                  ]}
                />
                <p className="hero-rotator" data-reveal>
                  Built for <Rotator words={AUDIENCES} />
                </p>
                <p className="hero-lead" data-reveal>
                  Friendly, fast, professional websites and web apps — from MVP to launch, plus the
                  ongoing support that keeps them healthy. No bloat, no jargon, no surprises.
                </p>
                <div className="hero-ctas" data-reveal>
                  <Btn href="#contact" float cursor="Let's go" icon="→">
                    Start Your Project
                  </Btn>
                  <Btn href="#services" variant="ghost" cursor="Explore">
                    View Services
                  </Btn>
                </div>
              </div>

              <Orbit />

              <p className="travel-hint" aria-hidden="true">
                <span className="travel-text">Scroll to travel</span>
                <span className="travel-arrow">
                  <span />
                </span>
              </p>
            </section>

            {/* ========== MANIFESTO (interlude) ========== */}
            <section className="panel manifesto" aria-label="Our promise">
              <div className="manifesto-words" aria-hidden="true">
                <p className="giant giant--outline" data-parallax="-0.2">
                  Small business.
                </p>
                <p className="giant giant--fill" data-parallax="0.1">
                  Big presence.
                </p>
              </div>
              <div className="manifesto-copy" data-reveal>
                <p className="manifesto-text">
                  Great websites shouldn&rsquo;t be reserved for big budgets. We design, build and
                  look after your site — <mark className="hd-mark">all under one roof</mark>, in
                  plain English.
                </p>
                <ul className="tag-row" aria-label="What we build">
                  {WHAT_WE_BUILD.map((thing) => (
                    <li key={thing}>{thing}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* ========== 02 · SERVICES ========== */}
            <section
              className="panel services"
              id="services"
              data-chapter="Services"
              aria-labelledby="services-title"
            >
              <header className="panel-head">
                <p className="eyebrow" data-reveal>
                  <span className="idx">02</span>What we do
                </p>
                <h2 id="services-title" data-wipe>
                  Everything you need to get online &amp; grow
                </h2>
                <p className="panel-lead" data-reveal>
                  From your first website to a full custom app — designed, built and looked after in
                  one place.
                </p>
                <p className="drag-note" data-reveal aria-hidden="true">
                  <span className="drag-pill">⟷</span> Scroll or drag to explore
                </p>
                <Btn to="/services" variant="ghost" cursor="More" icon="→" data-reveal>
                  All services in detail
                </Btn>
              </header>

              <Deck className="card-row" label="Our services" item="service" hint="Swipe for more">
                {SERVICES.map((service, i) => (
                  <article className="card service" key={service.slug} data-tilt data-reveal>
                    <span className="card-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="card-icon" aria-hidden="true">
                      <Icon name={service.icon} className="h-7 w-7" />
                    </span>
                    <h3>{service.title}</h3>
                    <p>{service.short}</p>
                    <ul className="ticks">
                      {service.features.slice(0, 3).map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </Deck>
            </section>

            {/* ========== 03 · WHY US ========== */}
            <section className="panel why" id="why" data-chapter="Why Us" aria-labelledby="why-title">
              <header className="panel-head">
                <p className="eyebrow" data-reveal>
                  <span className="idx">03</span>Why WebQuokka
                </p>
                <h2 id="why-title" data-wipe>
                  Big-studio quality, small-business friendly
                </h2>
                <p className="panel-lead" data-reveal>
                  We started WebQuokka because great websites shouldn&rsquo;t be reserved for big
                  budgets. Here&rsquo;s what working with us feels like.
                </p>
                <Btn href="#process" variant="ghost" cursor="Next" icon="→" data-reveal>
                  See how it works
                </Btn>
              </header>

              <Deck className="why-grid" label="Why WebQuokka" item="reason" hint="Swipe for more">
                {WHY_CHOOSE_US.map((item, i) => (
                  <article className="why-item" key={item.title} data-reveal data-spotlight>
                    <span className="why-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="why-icon" aria-hidden="true">
                      <Icon name={item.icon} className="h-7 w-7" />
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </Deck>
            </section>

            {/* ========== 04 · PROCESS ========== */}
            <section
              className="panel process"
              id="process"
              data-chapter="Process"
              aria-labelledby="process-title"
            >
              <header className="panel-head">
                <p className="eyebrow" data-reveal>
                  <span className="idx">04</span>How it works
                </p>
                <h2 id="process-title" data-wipe>
                  Idea to launch, step by step
                </h2>
                <p className="panel-lead" data-reveal>
                  No confusing tech talk. Just a clear path from first chat to a site you&rsquo;re
                  proud of.
                </p>
                <Btn to="/process" variant="ghost" cursor="More" icon="→" data-reveal>
                  The full process
                </Btn>
              </header>

              <div className="timeline">
                <div className="timeline-line" aria-hidden="true">
                  <span className="timeline-fill" />
                </div>
                <Deck
                  as="ol"
                  className="steps"
                  label="How it works"
                  item="step"
                  hint="Swipe through the steps"
                  fillsTimeline
                >
                  {PROCESS_STEPS.map((step, i) => (
                    <li className="step" key={step.title} data-reveal>
                      <span className="step-node" aria-hidden="true" />
                      <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
                      <h3>
                        <Icon name={step.icon} className="h-5 w-5" />
                        {step.title}
                      </h3>
                      <p>{step.description}</p>
                    </li>
                  ))}
                </Deck>
              </div>
            </section>

            {/* ========== 05 · PRICING ========== */}
            <section
              className="panel pricing"
              id="pricing"
              data-chapter="Pricing"
              aria-labelledby="pricing-title"
            >
              <header className="panel-head">
                <p className="eyebrow" data-reveal>
                  <span className="idx">05</span>Simple pricing
                </p>
                <h2 id="pricing-title" data-wipe>
                  Honest prices, no surprises
                </h2>
                <p className="panel-lead" data-reveal>
                  Indicative starting points in Australian dollars. Pick one and we&rsquo;ll tailor
                  it to fit.
                </p>
                <p className="panel-note" data-reveal>
                  Not sure which fits?{' '}
                  <a href="#contact" className="text-link">
                    Tell us about your project
                  </a>{' '}
                  and we&rsquo;ll recommend the right option — free.
                </p>
              </header>

              <Deck className="plans" label="Our packages" item="package" hint="Swipe to compare">
                {PROJECT_PACKAGES.map((plan) => {
                  const { amount, comma, note } = parsePrice(plan.price)
                  return (
                    <article
                      className={`plan${plan.popular ? ' plan--featured' : ''}`}
                      key={plan.name}
                      data-reveal
                      data-tilt
                    >
                      {plan.popular && <span className="plan-flag">Recommended</span>}
                      <h3>{plan.name}</h3>
                      <p className="plan-desc">{plan.description}</p>
                      <p className={`plan-price${amount ? '' : ' plan-price--text'}`}>
                        {amount ? (
                          <>
                            <span className="cur">$</span>
                            <Counter to={amount} comma={comma} />
                          </>
                        ) : (
                          plan.price
                        )}
                        <span className="per">{amount ? `${note} · AUD` : 'Scoped to your build'}</span>
                      </p>
                      <ul className="ticks">
                        {plan.features.slice(0, 5).map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                      <Btn
                        href="#contact"
                        variant={plan.popular ? 'primary' : 'ghost'}
                        block
                        cursor="Pick"
                        icon={plan.popular ? '→' : undefined}
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent('horizon:plan', { detail: `${plan.name} package` }),
                          )
                        }
                      >
                        Choose {plan.name}
                      </Btn>
                    </article>
                  )
                })}
              </Deck>
            </section>

            {/* ========== 06 · CONTACT ========== */}
            <section
              className="panel contact"
              id="contact"
              data-chapter="Contact"
              aria-labelledby="contact-title"
            >
              <div className="contact-info">
                <p className="eyebrow" data-reveal>
                  <span className="idx">06</span>Get in touch
                </p>
                <h2 id="contact-title" data-wipe>
                  Let&rsquo;s build something great together
                </h2>
                <p className="panel-lead" data-reveal>
                  Tell us a little about your business and what you need. We&rsquo;ll come back with
                  friendly advice and a free, no-obligation quote.
                </p>
                <ul className="contact-list" data-reveal>
                  <li>
                    <a href={SITE.emailHref} data-cursor="Email">
                      <span className="ci" aria-hidden="true">
                        <Icon name="Mail" className="h-5 w-5" />
                      </span>
                      <span>
                        <small>Email us</small>
                        {SITE.email}
                      </span>
                    </a>
                  </li>
                  <li>
                    <a href={SITE.phoneHref} data-cursor="Call">
                      <span className="ci" aria-hidden="true">
                        <Icon name="Phone" className="h-5 w-5" />
                      </span>
                      <span>
                        <small>Call us</small>
                        {SITE.phone}
                      </span>
                    </a>
                  </li>
                  <li>
                    <span className="contact-static">
                      <span className="ci" aria-hidden="true">
                        <Icon name="MapPin" className="h-5 w-5" />
                      </span>
                      <span>
                        <small>Find us</small>
                        {SITE.location}
                      </span>
                    </span>
                  </li>
                </ul>
              </div>

              <HorizonContactForm />
            </section>

            {/* ========== END · FOOTER PANEL ========== */}
            <footer className="panel footer-panel" aria-label="Footer">
              <p className="giant giant--outline footer-giant" data-parallax="-0.2" aria-hidden="true">
                Let&rsquo;s talk.
              </p>
              <div className="footer-inner" data-reveal>
                <p className="footer-blurb">
                  Friendly, professional web development for Perth businesses — from MVP to launch,
                  and everything after. Proudly based in {SITE.location}.
                </p>
                <div className="footer-cols">
                  <div>
                    <p className="footer-h">Explore</p>
                    <ul>
                      {CHAPTERS.slice(1).map((chapter) => (
                        <li key={chapter.id}>
                          <a href={`#${chapter.id}`}>{chapter.label}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="footer-h">Client Portal</p>
                    <ul>
                      <li>
                        <a href={PORTAL.login}>Sign in</a>
                      </li>
                      <li>
                        <a href={PORTAL.signup}>Create an account</a>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="footer-h">Contact</p>
                    <ul>
                      <li>
                        <a href={SITE.emailHref}>{SITE.email}</a>
                      </li>
                      <li>
                        <a href={SITE.phoneHref}>{SITE.phone}</a>
                      </li>
                      <li>{SITE.location}</li>
                    </ul>
                  </div>
                </div>
                <NewsletterSignup />
                <Btn href="#hero" variant="ghost" cursor="Rewind" icon="←" iconBack>
                  Back to the start
                </Btn>
                <p className="footer-legal">
                  © {new Date().getFullYear()} {SITE.name}. All rights reserved. Made with 🧡 in
                  Perth, WA.
                </p>
              </div>
            </footer>

          </div>
        </div>
      </main>

      <ChapterProgress />
    </>
  )
}
