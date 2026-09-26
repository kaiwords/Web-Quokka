import { Link } from 'react-router-dom'
import { NAV_LINKS, PORTAL, SERVICES, SITE } from '../../lib/constants'
import Icon from '../ui/Icon'
import Btn from './Btn'
import QuokkaMark from './QuokkaMark'

/**
 * Footer for the inner routes. The home journey ends on its own footer panel
 * inside the rail, so this one only appears on the vertical pages.
 */
export default function HorizonFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer" aria-label="Footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand" data-reveal>
          <Link to="/" className="logo" data-cursor="Home">
            <QuokkaMark />
            <span className="logo-text">
              <span className="logo-name">{SITE.name}</span>
              <span className="logo-sub">Studio Design</span>
            </span>
          </Link>
          <p className="footer-blurb">
            Friendly, professional web development for Perth businesses — from MVP to launch, and
            everything after.
          </p>
          <Btn to="/contact" cursor="Let's talk" icon="→">
            Start Your Project
          </Btn>
        </div>

        <div data-reveal>
          <p className="footer-h">Explore</p>
          <ul className="site-footer-list">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div data-reveal>
          <p className="footer-h">Services</p>
          <ul className="site-footer-list">
            {SERVICES.map((service) => (
              <li key={service.slug}>
                <Link to="/services">{service.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div data-reveal>
          <p className="footer-h">Client area</p>
          <ul className="site-footer-list">
            <li>
              <a href={PORTAL.clientLogin}>
                <Icon name="LogIn" className="inline h-4 w-4" /> Client login
              </a>
            </li>
            <li>
              <a href={PORTAL.clientSignup}>
                <Icon name="UserPlus" className="inline h-4 w-4" /> Create an account
              </a>
            </li>
          </ul>
        </div>

        <div data-reveal>
          <p className="footer-h">Contact</p>
          <ul className="site-footer-list">
            <li>
              <a href={SITE.emailHref}>
                <Icon name="Mail" className="inline h-4 w-4" /> {SITE.email}
              </a>
            </li>
            <li>
              <a href={SITE.phoneHref}>
                <Icon name="Phone" className="inline h-4 w-4" /> {SITE.phone}
              </a>
            </li>
            <li>
              <Icon name="MapPin" className="inline h-4 w-4" /> {SITE.location}
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer-legal">
        <p>
          © {year} {SITE.name}. All rights reserved.
        </p>
        <p>
          Made with 🧡 in Perth, Western Australia. ·{' '}
          <a href={PORTAL.staffLogin} className="footer-staff-link">
            Staff login
          </a>
        </p>
      </div>
    </footer>
  )
}
