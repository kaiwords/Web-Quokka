import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CHAPTERS } from '../../lib/chapters'
import { cn } from '../../lib/utils'
import ChatWidget from './ChatWidget'
import { useHorizon } from './HorizonContext'

/**
 * Floating actions: a rewind button that appears once you've travelled — its
 * arrow points back along the journey (left on the horizontal rail, up on
 * vertical pages) — and the chat widget's launcher, which steps aside when
 * you reach the contact chapter.
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
        <span aria-hidden="true">{onHome && horizontal ? '←' : '↑'}</span>
      </button>
      <ChatWidget />
    </div>
  )
}
