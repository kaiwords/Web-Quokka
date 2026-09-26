import { Fragment } from 'react'
import { cn } from '../../lib/utils'

/**
 * Deals a heading's words up from behind a mask, one after another, once the
 * reveal system marks it `.is-in`. Pass the text as segments so a word can be
 * accented: `[{ text: 'Websites that move your business' }, { text: 'forward.', accent: true }]`
 */
export default function SplitText({ as: Tag = 'h1', segments, className, ...props }) {
  let i = 0

  return (
    <Tag className={cn('is-split', className)} data-split {...props}>
      {segments.flatMap((seg) =>
        seg.text
          .split(/\s+/)
          .filter(Boolean)
          .map((word) => (
            <Fragment key={`${word}-${i}`}>
              <span className="word">
                <span style={{ '--i': i++ }}>{seg.accent ? <em>{word}</em> : word}</span>
              </span>{' '}
            </Fragment>
          )),
      )}
    </Tag>
  )
}
