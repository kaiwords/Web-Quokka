import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CHAPTERS } from '../../lib/chapters'
import { cn } from '../../lib/utils'
import { useHorizon } from './HorizonContext'

/**
 * Floating actions: a rewind button that appears once you've travelled, and a
 * free-quote pill that steps aside when you reach the contact chapter.
 */
export default function FloatingActions() {
  const { away, index, horizontal } = useHorizon()
  const location = useLocation()
  const onHome = location.pathname === '/'
  const [scrolled, setScrolled] = useState(false)

  // Off the home route there is no rail to report progress, so watch the page.
  useEffect(() => {
    if (onHome) return undefined
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.5)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [onHome])

  const isAway = onHome ? away : scrolled
  const atContact = onHome && index === CHAPTERS.length - 1
  const rewind = () => window.scrollTo({ top: 0, behavior: horizontal ? 'auto' : 'smooth' })

  return (
    <div className={cn('fab', isAway && 'is-away', atContact && 'is-hidden')}>
      <button
        className="fab-btn fab-btn--top"
        type="button"
        aria-label="Back to the start"
        data-magnetic
        data-cursor="Rewind"
        onClick={rewind}
      >
        <span aria-hidden="true">←</span>
      </button>
      {onHome ? (
        <a href="#contact" className="fab-btn fab-btn--quote" data-magnetic data-cursor="Quote">
          <span className="fab-emoji" aria-hidden="true">
            💬
          </span>
          <span className="fab-text">Free quote</span>
        </a>
      ) : (
        <Link to="/contact" className="fab-btn fab-btn--quote" data-magnetic data-cursor="Quote">
          <span className="fab-emoji" aria-hidden="true">
            💬
          </span>
          <span className="fab-text">Free quote</span>
        </Link>
      )}
    </div>
  )
}
