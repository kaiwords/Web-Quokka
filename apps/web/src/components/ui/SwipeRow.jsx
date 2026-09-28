import { Children, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { cn } from '../../lib/utils'
import { SwipeRowContext } from './swipeRowContext'

const MOBILE_QUERY = '(max-width: 639.98px)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function useMediaQuery(query) {
  const subscribe = useMemo(
    () => (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/**
 * Below `sm` this renders its children as a horizontal, snap-scrolling row that
 * bleeds to the screen edges (native touch scroll, mouse drag, arrow keys, dots).
 * From `sm` up it becomes whatever layout the call site passes in `className`
 * (e.g. `sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5`), so desktop is untouched.
 */
export default function SwipeRow({
  children,
  label,
  className,
  itemClassName,
  itemWidth = 'w-[82%]',
  dots = true,
  bleed = true,
}) {
  const swipe = useMediaQuery(MOBILE_QUERY)
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY)
  const scrollerRef = useRef(null)
  const drag = useRef({ active: false, moved: false, startX: 0, startLeft: 0 })
  const [active, setActive] = useState(0)
  const items = Children.toArray(children).filter(Boolean)
  const context = useMemo(() => ({ swipe }), [swipe])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!swipe || !dots || !scroller) return undefined

    const ratios = new Map()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target, entry.intersectionRatio)
        let best = 0
        let bestRatio = -1
        Array.from(scroller.children).forEach((child, i) => {
          const ratio = ratios.get(child) ?? 0
          if (ratio > bestRatio) {
            bestRatio = ratio
            best = i
          }
        })
        // Narrow items cannot align the last one to the start edge, so treat "scrolled to the end" as the last item.
        const atEnd = scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 1
        setActive(atEnd ? scroller.children.length - 1 : best)
      },
      { root: scroller, threshold: [0.25, 0.5, 0.75, 1] },
    )
    Array.from(scroller.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [swipe, dots, items.length])

  const scrollToIndex = useCallback(
    (index) => {
      const scroller = scrollerRef.current
      const child = scroller?.children[index]
      if (!child) return
      const paddingLeft = parseFloat(getComputedStyle(scroller).paddingLeft) || 0
      scroller.scrollTo({
        left: child.offsetLeft - paddingLeft,
        behavior: reducedMotion ? 'auto' : 'smooth',
      })
    },
    [reducedMotion],
  )

  function nearestIndex() {
    const scroller = scrollerRef.current
    const paddingLeft = parseFloat(getComputedStyle(scroller).paddingLeft) || 0
    let nearest = 0
    let nearestDistance = Infinity
    Array.from(scroller.children).forEach((child, i) => {
      const distance = Math.abs(child.offsetLeft - paddingLeft - scroller.scrollLeft)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = i
      }
    })
    return nearest
  }

  function onKeyDown(e) {
    if (!swipe) return
    const last = items.length - 1
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const step = e.key === 'ArrowRight' ? 1 : -1
      scrollToIndex(Math.min(last, Math.max(0, active + step)))
    } else if (e.key === 'Home') {
      e.preventDefault()
      scrollToIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      scrollToIndex(last)
    }
  }

  // Mouse drag-to-scroll for narrow desktop windows. Touch keeps native scrolling.
  function onPointerDown(e) {
    if (!swipe || e.pointerType !== 'mouse' || e.button !== 0) return
    drag.current = { active: true, moved: false, startX: e.clientX, startLeft: scrollerRef.current.scrollLeft }
  }

  function onPointerMove(e) {
    const state = drag.current
    if (!state.active) return
    const dx = e.clientX - state.startX
    if (!state.moved && Math.abs(dx) > 6) {
      // Only capture once a real drag starts, so an ordinary click still reaches the card link.
      state.moved = true
      scrollerRef.current.dataset.dragging = 'true'
      scrollerRef.current.setPointerCapture(e.pointerId)
    }
    if (state.moved) {
      e.preventDefault()
      scrollerRef.current.scrollLeft = state.startLeft - dx
    }
  }

  function onPointerEnd(e) {
    const state = drag.current
    if (!state.active) return
    state.active = false
    const scroller = scrollerRef.current
    delete scroller.dataset.dragging
    if (scroller.hasPointerCapture(e.pointerId)) scroller.releasePointerCapture(e.pointerId)
    if (state.moved) {
      scrollToIndex(nearestIndex())
      // The click that follows a drag must not activate a card link.
      setTimeout(() => {
        state.moved = false
      }, 0)
    }
  }

  function onClickCapture(e) {
    if (drag.current.moved) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <SwipeRowContext.Provider value={context}>
      <div
        ref={scrollerRef}
        role="region"
        aria-label={label}
        tabIndex={swipe ? 0 : undefined}
        data-lenis-prevent-touch={swipe ? '' : undefined}
        data-lenis-prevent-wheel={swipe ? '' : undefined}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClickCapture={onClickCapture}
        onDragStart={(e) => drag.current.active && e.preventDefault()}
        className={cn(
          'relative -my-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain py-4',
          'scrollbar-none [&::-webkit-scrollbar]:hidden',
          'data-dragging:cursor-grabbing data-dragging:select-none data-dragging:snap-none',
          bleed && '-mx-5 px-5 scroll-px-5 sm:mx-0 sm:scroll-px-0 sm:px-0',
          'sm:my-0 sm:snap-none sm:overflow-visible sm:py-0',
          className,
        )}
      >
        {items.map((child, i) => (
          <div
            key={child.key ?? i}
            className={cn(
              'grid shrink-0 snap-start sm:w-auto sm:shrink sm:snap-align-none',
              itemWidth,
              itemClassName,
            )}
          >
            {child}
          </div>
        ))}
      </div>

      {dots && swipe && items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1 sm:hidden">
          {items.map((child, i) => (
            <button
              key={child.key ?? i}
              type="button"
              aria-label={`Go to item ${i + 1} of ${items.length}`}
              aria-current={i === active ? 'true' : undefined}
              onClick={() => scrollToIndex(i)}
              className="flex h-8 w-8 items-center justify-center rounded-full pointer-coarse:h-11 pointer-coarse:w-11"
            >
              <span
                className={cn(
                  'block h-1.5 rounded-full transition-all duration-300',
                  i === active ? 'w-5 bg-forest-500' : 'w-1.5 bg-cream-500',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </SwipeRowContext.Provider>
  )
}
