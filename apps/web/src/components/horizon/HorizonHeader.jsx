import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CHAPTERS } from '../../lib/chapters'
import { NAV_LINKS, PORTAL, SITE } from '../../lib/constants'
import { cn } from '../../lib/utils'
import Btn from './Btn'
import QuokkaMark from './QuokkaMark'
import { useHorizon } from './HorizonContext'

/**
 * Fixed header that stays transparent until you start moving, plus the
 * full-screen menu. On the home route it also shows which chapter of the
 * horizontal journey you're currently in.
 */
export default function HorizonHeader() {
  const { solid, index } = useHorizon()
  const location = useLocation()
  const onHome = location.pathname === '/'

  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuBtnRef = useRef(null)
  const menuRef = useRef(null)
  const chapter = CHAPTERS[index] || CHAPTERS[0]

  const closeMenu = () => setMenuOpen(false)

  // The rail reports travel on the home route; the inner routes are ordinary
  // vertical pages, so the header watches the page scroll itself. Without this
  // it would stay transparent and the content would run straight through it.
  useEffect(() => {
    if (onHome) return undefined
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onHome])

  const isSolid = onHome ? solid : scrolled

  // The rail listens for this so the wheel and arrow keys stop steering while
  // the menu is up. The menu itself stays mounted and fades via `.is-open`, so
  // opening it needs no second render.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('horizon:menu', { detail: menuOpen }))
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
            <QuokkaMark />
            <span className="logo-text">
              <span className="logo-name">{SITE.name}</span>
              <span className="logo-sub">Studio Design</span>
            </span>
          </a>
        ) : (
          <Link to="/" className="logo" data-cursor="Home" aria-label={`${SITE.name} — home`}>
            <QuokkaMark />
            <span className="logo-text">
              <span className="logo-name">{SITE.name}</span>
              <span className="logo-sub">Studio Design</span>
            </span>
          </Link>
        )}

        {onHome && (
          <p className="chapter-now" aria-hidden="true">
            <span className="chapter-num">{String(index + 1).padStart(2, '0')}</span>
            <span className="chapter-sep" />
            <span className="chapter-name is-swap" key={chapter.id}>
              {chapter.label}
            </span>
          </p>
        )}

        <div className="header-actions">
          <Btn
            href={PORTAL.clientLogin}
            variant="ghost"
            size="sm"
            cursor="Client login"
            icon="→"
          >
            Client Login
          </Btn>
          <Btn
            {...(onHome ? { href: '#contact' } : { to: '/contact' })}
            size="sm"
            cursor="Let's talk"
            icon="→"
            onClick={closeMenu}
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
          <p className="menu-kicker">Client portal</p>
          <a href={PORTAL.clientLogin}>Client login</a>
          <a href={PORTAL.clientSignup}>Create an account</a>
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
