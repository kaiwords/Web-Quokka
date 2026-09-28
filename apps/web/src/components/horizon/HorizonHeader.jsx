import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { NAV_LINKS, PORTAL, SITE } from '../../lib/constants'
import { cn } from '../../lib/utils'
import Btn from './Btn'

/**
 * Fixed header that stays transparent until you start moving, plus the
 * full-screen menu.
 */
export default function HorizonHeader() {
  const location = useLocation()
  const onHome = location.pathname === '/'

  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuBtnRef = useRef(null)
  const menuRef = useRef(null)

  const closeMenu = () => setMenuOpen(false)

  // Every route is an ordinary vertical page now, so the header watches the
  // page scroll itself. Without this it would stay transparent and the
  // content would run straight through it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isSolid = scrolled

  // The menu stays mounted and fades via `.is-open`, so opening it needs no
  // second render.
  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
    if (!menuOpen) return undefined
    const focusTimer = setTimeout(() => {
      const first = menuRef.current?.querySelector('a')
      if (first) first.focus()
    }, 60)
    return () => clearTimeout(focusTimer)
  }, [menuOpen])

  useEffect(() => () => document.body.classList.remove('menu-open'), [])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeMenu()
        menuBtnRef.current?.focus()
        return
      }
      if (e.key !== 'Tab') return
      const items = [menuBtnRef.current, ...Array.from(menuRef.current?.querySelectorAll('a') || [])]
      const i = items.indexOf(document.activeElement)
      const next = e.shiftKey
        ? i <= 0
          ? items.length - 1
          : i - 1
        : i === items.length - 1
          ? 0
          : i + 1
      e.preventDefault()
      items[next]?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <>
      <header className={cn('site-header', isSolid && 'is-solid')}>
        {onHome ? (
          <a href="#hero" className="logo" data-cursor="Home" aria-label={`${SITE.name} — back to the start`}>
            <img src="/brand/wordmark-brown.png" alt="" className="logo-wordmark" />
          </a>
        ) : (
          <Link to="/" className="logo" data-cursor="Home" aria-label={`${SITE.name} — home`}>
            <img src="/brand/wordmark-brown.png" alt="" className="logo-wordmark" />
          </Link>
        )}

        <div className="header-actions">
          <Btn
            href={PORTAL.login}
            variant="ghost"
            size="sm"
            cursor="Client Portal"
            icon="→"
            className="header-portal-btn"
          >
            Client Portal
          </Btn>
          <Btn
            {...(onHome ? { href: '#contact' } : { to: '/contact' })}
            variant="forest"
            size="sm"
            cursor="Let's talk"
            icon="→"
            onClick={closeMenu}
            className="header-quote-btn"
          >
            Free Quote
          </Btn>
          <button
            ref={menuBtnRef}
            className="menu-btn"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="horizon-menu"
            data-magnetic
            data-cursor="Menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="menu-btn-lines" aria-hidden="true">
              <span />
              <span />
            </span>
            <span className="menu-btn-text">{menuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>
      </header>

      <div
        className={cn('menu', menuOpen && 'is-open')}
        id="horizon-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        inert={menuOpen ? undefined : ''}
      >
        <nav className="menu-nav" aria-label="Main">
          <ol>
            {NAV_LINKS.map((link, i) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) => cn(isActive && 'is-current')}
                  onClick={closeMenu}
                >
                  <span className="menu-i">{String(i + 1).padStart(2, '0')}</span>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ol>
        </nav>
        <div className="menu-aside">
          <p className="menu-kicker">Client Portal</p>
          <a href={PORTAL.login}>Sign in to the Client Portal</a>
          <a href={PORTAL.signup}>Create an account</a>
          <p className="menu-kicker" style={{ marginTop: '1.2rem' }}>
            Say hello
          </p>
          <a href={SITE.emailHref}>{SITE.email}</a>
          <a href={SITE.phoneHref}>{SITE.phone}</a>
          <p className="menu-note">{SITE.location} · We reply within 24 hours.</p>
        </div>
      </div>
    </>
  )
}
