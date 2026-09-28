import { useEffect, useRef } from 'react'
import { gsap, initPageTurn } from '../../lib/animation'
import { cn } from '../../lib/utils'

/**
 * The book page-turn wrapper — the standard chapter container on Branch2.
 * Wrap any full-width section in it and, as the user scrolls on, the section
 * closes like a page of a book (tips back around its top edge with a settling
 * shadow) while the next one settles flat beneath. See ANIMATIONS.md.
 *
 * @param {string} as    tag to render ('section' by default, 'footer' etc.)
 * @param {string} mode  'fold' (default, no pinning) or 'stack' (pins while
 *                       the next section slides over it — max 1–2 per page,
 *                       needs an opaque background on the section that covers)
 *
 * Reduced motion: renders a plain section — no pin, no fold, full opacity.
 */
export default function PageTurnSection({
  as: Tag = 'section',
  mode = 'fold',
  className,
  children,
  ...props
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const ctx = gsap.context(() => initPageTurn(el, { mode }), el)
    return () => ctx.revert()
  }, [mode])

  return (
    <Tag ref={ref} className={cn('page-turn', mode === 'stack' && 'page-turn--stack', className)} {...props}>
      {children}
    </Tag>
  )
}
