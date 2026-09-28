import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { scrollToTop } from '../../lib/scroll'
import ChatWidget from './ChatWidget'

/**
 * Floating actions: a rewind button that appears once you've scrolled away —
 * every page is a vertical journey now, so its arrow always points up — and
 * the chat widget's launcher, which steps aside while the home page's
 * contact section is on screen (the form is right there).
 */
export default function FloatingActions() {
  const location = useLocation()
  const onHome = location.pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [atContact, setAtContact] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.5)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // On home, hide the chat launcher while the contact chapter is in view
  // (the render gate below also ignores any stale value off-home).
  useEffect(() => {
    if (!onHome || !('IntersectionObserver' in window)) return undefined
    const target = document.getElementById('contact')
    if (!target) return undefined
    const io = new IntersectionObserver(
      ([entry]) => setAtContact(entry.isIntersecting),
      { threshold: 0.25 },
    )
    io.observe(target)
    return () => io.disconnect()
  }, [onHome, location.pathname])

  return (
    <div className={cn('fab', scrolled && 'is-away', onHome && atContact && 'is-hidden')}>
      <button
        className="fab-btn fab-btn--top"
        type="button"
        aria-label="Back to the top"
        data-magnetic
        data-cursor="Top"
        onClick={scrollToTop}
      >
        <span aria-hidden="true">↑</span>
      </button>
      <ChatWidget />
    </div>
  )
}
