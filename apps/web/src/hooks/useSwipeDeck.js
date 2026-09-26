import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp, cursorState, prefersReducedMotion, wideEnoughQuery } from '../lib/horizon'

/** Children that own their own pointer gestures, so a drag must not start on them. */
const NO_DRAG = 'a, button, input, select, textarea, label, [data-no-drag]'

/**
 * True when the rail is not carrying this row sideways itself, so the row has to
 * carry itself.
 *
 * The `is-h` class the rail owns is the authority. Child effects run before the
 * rail's, though, so on the very first paint it has not been written yet — hence
 * the same test the rail makes as the fallback, which keeps a desktop from
 * flashing the swipe controls for a frame.
 */
function wantsDeck() {
  if (typeof document === 'undefined') return false
  if (document.documentElement.classList.contains('is-h')) return false
  return !wideEnoughQuery().matches || prefersReducedMotion()
}

/** Distance from the deck's start padding edge to card `i` — its snap position. */
function snapOf(deck, i) {
  const child = deck.children[i]
  if (!child) return 0
  const pad = parseFloat(getComputedStyle(deck).paddingLeft) || 0
  return (
    child.getBoundingClientRect().left -
    deck.getBoundingClientRect().left +
    deck.scrollLeft -
    pad
  )
}

function nearestIndex(deck) {
  const max = deck.scrollWidth - deck.clientWidth
  const at = deck.scrollLeft
  // The last card can rarely reach the start edge, so the end of the scroll
  // counts as arriving at it.
  if (max > 0 && at >= max - 1) return deck.children.length - 1
  let nearest = 0
  let best = Infinity
  for (let i = 0; i < deck.children.length; i += 1) {
    const d = Math.abs(snapOf(deck, i) - at)
    if (d < best) {
      best = d
      nearest = i
    }
  }
  return nearest
}

/**
 * A row of cards, still read sideways on the screens that never enter the rail.
 *
 * On a phone the panels stack, and a five-card row used to become five tall
 * blocks to scroll past. Here the row stays a row travelling right to left:
 * native touch swipe, mouse drag, arrow keys and dots all advance it, with the
 * next card peeking in from the right so there is something to reach for.
 *
 * The mode follows the `is-h` class the rail owns rather than re-testing the
 * media query, so a wide screen asking for reduced motion — vertical, but not
 * narrow — gets the deck as well.
 *
 * @param {object}  deckRef              the scrolling row
 * @param {boolean} options.fillsTimeline drive the enclosing `.timeline` fill and
 *                                        lit nodes from swipe progress instead of
 *                                        from the page scroll
 * @returns {{ swipe: boolean, index: number, count: number, goTo: Function }}
 */
export default function useSwipeDeck(deckRef, { fillsTimeline = false } = {}) {
  const [swipe, setSwipe] = useState(wantsDeck)
  const [index, setIndex] = useState(0)
  const [count, setCount] = useState(0)
  const drag = useRef({ down: false, moved: false, startX: 0, startLeft: 0 })

  useEffect(() => {
    const read = () => setSwipe(wantsDeck())
    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])

  const goTo = useCallback(
    (i) => {
      const deck = deckRef.current
      if (!deck || !deck.children.length) return
      const at = clamp(i, 0, deck.children.length - 1)
      deck.scrollTo({
        left: snapOf(deck, at),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    },
    [deckRef],
  )

  useEffect(() => {
    const deck = deckRef.current
    if (!deck) return undefined
    setCount(deck.children.length)

    const timeline = fillsTimeline ? deck.closest('.timeline') : null
    const nodes = timeline ? Array.from(deck.children) : []

    if (!swipe) {
      // Horizontal mode drives the same line from the rail, so hand it back.
      if (timeline) {
        timeline.removeAttribute('data-swipe')
        timeline.style.removeProperty('--fill')
      }
      setIndex(0)
      return undefined
    }

    if (timeline) timeline.setAttribute('data-swipe', '')

    let queued = false

    function readScroll() {
      const at = nearestIndex(deck)
      setIndex(at)
      if (!timeline) return
      const max = deck.scrollWidth - deck.clientWidth
      const fill = max > 0 ? clamp(deck.scrollLeft / max, 0, 1) : 1
      timeline.style.setProperty('--fill', fill.toFixed(3))
      nodes.forEach((node, i) => node.classList.toggle('is-lit', i <= at))
    }

    function onScroll() {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        readScroll()
      })
    }

    /* ---------- mouse drag (touch keeps native scrolling) ---------- */

    function onPointerDown(e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest(NO_DRAG)) return
      drag.current = { down: true, moved: false, startX: e.clientX, startLeft: deck.scrollLeft }
    }

    function onPointerMove(e) {
      const state = drag.current
      if (!state.down) return
      const dx = e.clientX - state.startX
      if (!state.moved && Math.abs(dx) > 6) {
        // Only capture once a real drag starts, so an ordinary click still
        // reaches the button inside the card.
        state.moved = true
        deck.dataset.dragging = 'true'
        cursorState.setDrag(true)
        deck.setPointerCapture(e.pointerId)
        const sel = window.getSelection && window.getSelection()
        if (sel) sel.removeAllRanges()
      }
      if (!state.moved) return
      e.preventDefault()
      deck.scrollLeft = state.startLeft - dx
    }

    function onPointerEnd(e) {
      const state = drag.current
      if (!state.down) return
      state.down = false
      delete deck.dataset.dragging
      cursorState.setDrag(false)
      if (deck.hasPointerCapture(e.pointerId)) deck.releasePointerCapture(e.pointerId)
      if (!state.moved) return
      goTo(nearestIndex(deck))
      // The click that ends a drag must not activate whatever it landed on.
      setTimeout(() => {
        state.moved = false
      }, 0)
    }

    function onClickCapture(e) {
      if (!drag.current.moved) return
      e.preventDefault()
      e.stopPropagation()
    }

    // Native image/text dragging would fight the scroll gesture.
    function onDragStart(e) {
      if (drag.current.down) e.preventDefault()
    }

    function onKeyDown(e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const last = deck.children.length - 1
      let to = null
      if (e.key === 'ArrowRight') to = nearestIndex(deck) + 1
      else if (e.key === 'ArrowLeft') to = nearestIndex(deck) - 1
      else if (e.key === 'Home') to = 0
      else if (e.key === 'End') to = last
      if (to === null) return
      e.preventDefault()
      e.stopPropagation()
      goTo(to)
    }

    readScroll()
    deck.addEventListener('scroll', onScroll, { passive: true })
    deck.addEventListener('pointerdown', onPointerDown)
    deck.addEventListener('pointermove', onPointerMove)
    deck.addEventListener('pointerup', onPointerEnd)
    deck.addEventListener('pointercancel', onPointerEnd)
    deck.addEventListener('click', onClickCapture, true)
    deck.addEventListener('keydown', onKeyDown)
    deck.addEventListener('dragstart', onDragStart)

    const ro = 'ResizeObserver' in window ? new ResizeObserver(onScroll) : null
    if (ro) ro.observe(deck)

    return () => {
      deck.removeEventListener('scroll', onScroll)
      deck.removeEventListener('pointerdown', onPointerDown)
      deck.removeEventListener('pointermove', onPointerMove)
      deck.removeEventListener('pointerup', onPointerEnd)
      deck.removeEventListener('pointercancel', onPointerEnd)
      deck.removeEventListener('click', onClickCapture, true)
      deck.removeEventListener('keydown', onKeyDown)
      deck.removeEventListener('dragstart', onDragStart)
      if (ro) ro.disconnect()
      delete deck.dataset.dragging
      if (timeline) {
        timeline.removeAttribute('data-swipe')
        timeline.style.removeProperty('--fill')
      }
    }
  }, [deckRef, swipe, fillsTimeline, goTo])

  return { swipe, index, count, goTo }
}
