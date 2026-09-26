import { useRef } from 'react'
import useSwipeDeck from '../../hooks/useSwipeDeck'

/**
 * One of the home journey's card rows.
 *
 * In the horizontal rail this is nothing but the row itself — the rail already
 * carries it sideways. On the screens that stay vertical it becomes a swipe
 * deck (see `useSwipeDeck`) and grows the controls that only make sense there:
 * a drag hint and a dot per card.
 *
 * @param {string} props.as            tag for the row ('div' or 'ol')
 * @param {string} props.className     the row's own layout class, e.g. 'plans'
 * @param {string} props.label         names the deck for assistive tech
 * @param {string} props.item          singular name of one card, for the dots
 * @param {string} props.hint          the nudge shown above the dots
 * @param {boolean} props.fillsTimeline the row drives a `.timeline` progress line
 */
export default function Deck({
  as: Tag = 'div',
  className,
  label,
  item = 'card',
  hint = 'Swipe or drag',
  fillsTimeline = false,
  children,
}) {
  const ref = useRef(null)
  const { swipe, index, count, goTo } = useSwipeDeck(ref, { fillsTimeline })
  const interactive = swipe && count > 1

  return (
    <>
      <Tag
        ref={ref}
        className={`${className} deck`}
        role={interactive ? 'group' : undefined}
        aria-label={interactive ? label : undefined}
        aria-roledescription={interactive ? 'carousel' : undefined}
        tabIndex={interactive ? 0 : undefined}
      >
        {children}
      </Tag>

      {interactive && (
        <div className="deck-nav">
          <p className="deck-hint" aria-hidden="true">
            <span className="drag-pill">⟷</span>
            {hint}
          </p>
          <div className="deck-dots">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`deck-dot${i === index ? ' is-on' : ''}`}
                aria-label={`Show ${item} ${i + 1} of ${count}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => goTo(i)}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
