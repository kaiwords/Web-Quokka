import { Menu, Moon, Sun, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { NAV_LINKS } from '../../lib/constants'
import { cn } from '../../lib/utils'
import Button from '../ui/Button'
import QuokkaMascot from '../ui/QuokkaMascot'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  function isLinkActive(to) {
    return to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-cream-50/90 shadow-sm backdrop-blur-md dark:bg-ink-900/90'
          : 'bg-transparent',
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-7xl items-center justify-between px-5 transition-all duration-300 sm:px-8 lg:px-10',
          scrolled ? 'py-3' : 'py-5',
        )}
      >
        <NavLink to="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-full">
          <motion.div whileHover={{ rotate: [0, -8, 8, -4, 0] }} transition={{ duration: 0.65 }}>
            <QuokkaMascot className="h-9 w-9" />
          </motion.div>
          <span className="font-heading text-xl font-bold text-sand-900 dark:text-cream-50">
            WebQuokka
          </span>
        </NavLink>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(link.to)
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={cn(
                  'relative rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'text-sky-700 dark:text-sky-300'
                    : 'text-sand-700 hover:bg-sand-100 hover:text-sand-900 dark:text-sand-200 dark:hover:bg-ink-800 dark:hover:text-cream-50',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-sky-100 dark:bg-sky-900/30"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {link.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-full p-2 text-sand-700 hover:bg-sand-100 dark:text-sand-200 dark:hover:bg-ink-800"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Button to="/contact" size="sm">
            Let&rsquo;s Talk
          </Button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="rounded-full p-2 text-sand-700 hover:bg-sand-100 dark:text-sand-200 dark:hover:bg-ink-800"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="rounded-full p-2 text-sand-800 hover:bg-sand-100 dark:text-cream-100 dark:hover:bg-ink-800"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col bg-cream-50 p-6 shadow-2xl dark:bg-ink-900 lg:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <QuokkaMascot className="h-8 w-8" />
                  <span className="font-heading text-lg font-bold text-sand-900 dark:text-cream-50">
                    WebQuokka
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="rounded-full p-2 text-sand-800 hover:bg-sand-100 dark:text-cream-100 dark:hover:bg-ink-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-10 flex flex-col gap-2" aria-label="Mobile primary">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 4, transition: { type: 'spring', stiffness: 420, damping: 24 } }}
                    whileTap={{ scale: 0.98, transition: { duration: 0.12 } }}
                    transition={{ delay: 0.04 * i + 0.12, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <NavLink
                      to={link.to}
                      end={link.to === '/'}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'block rounded-xl px-4 py-3 text-lg font-medium transition-colors',
                          isActive
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                            : 'text-sand-800 hover:bg-sand-100 dark:text-cream-100 dark:hover:bg-ink-800',
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto pt-6">
                <Button to="/contact" className="w-full" onClick={() => setMenuOpen(false)}>
                  Request a Free Quote
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
