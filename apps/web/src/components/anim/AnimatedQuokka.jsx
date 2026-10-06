import { useEffect, useRef } from 'react'
import { gsap, heavyMotionOK, motionOK } from '../../lib/animation'
import { cn } from '../../lib/utils'

/**
 * The animated brand quokka — pure SVG + GSAP character animation, matching
 * the mascot's look (sandy fur, blush ears, the grin). Decorative and hidden
 * from assistive tech; for real quokka photos/video use <QuokkaMedia>.
 *
 * Variants (see ANIMATIONS.md):
 * - "sit"  — rises in once, then just lives: blinks, twitches an ear.
 * - "peek" — leans in from the section's edge as it scrolls into view and
 *            retreats when you scroll back above it.
 * - "hop"  — scroll-scrubbed hop cycle across its section: scrub back and
 *            forth and the quokka hops back and forth with you.
 *
 * The idle blink/ear-twitch loops are CSS keyframes (killed globally by
 * prefers-reduced-motion); the scroll behaviours are GSAP, gated by motionOK.
 *
 * @param {'sit'|'peek'|'hop'} variant
 * @param {'left'|'right'}     side    edge it peeks from / hops away from
 * @param {number}             size    rendered width in px
 */
export default function AnimatedQuokka({ variant = 'sit', side = 'right', size = 120, className }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !motionOK()) return undefined

    const ctx = gsap.context(() => {
      const scene = el.parentElement || el

      if (variant === 'peek') {
        gsap.fromTo(
          el,
          { xPercent: side === 'right' ? 112 : -112, rotate: side === 'right' ? 10 : -10 },
          {
            xPercent: 0,
            rotate: 0,
            duration: 0.9,
            ease: 'back.out(1.4)',
            scrollTrigger: { trigger: scene, start: 'top 70%', toggleActions: 'play none none reverse' },
          },
        )
      } else if (variant === 'hop' && !heavyMotionOK()) {
        // The scrubbed hop is a nine-tween timeline re-evaluated every scroll
        // frame. On touch it becomes one hop on arrival: the quokka still
        // bounds in, it just is not tied to the scrollbar.
        gsap.fromTo(
          el,
          { xPercent: side === 'right' ? 40 : -40, opacity: 0 },
          {
            xPercent: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'back.out(1.5)',
            scrollTrigger: { trigger: scene, start: 'top 85%', once: true },
          },
        )
      } else if (variant === 'hop') {
        const inner = el.querySelector('.aq-inner')
        gsap.set(inner, { transformOrigin: '50% 100%' })
        const dir = side === 'right' ? -1 : 1
        const tl = gsap.timeline({
          scrollTrigger: { trigger: scene, start: 'top 80%', end: 'bottom 40%', scrub: 1 },
        })
        tl.to(el, { xPercent: dir * 55, ease: 'none', duration: 4 }, 0)
        for (let i = 0; i < 4; i += 1) {
          tl.to(inner, { y: -24, scaleY: 1.05, scaleX: 0.95, duration: 0.5, ease: 'power2.out' }, i)
          tl.to(inner, { y: 0, scaleY: 0.9, scaleX: 1.07, duration: 0.5, ease: 'power2.in' }, i + 0.5)
        }
        tl.to(inner, { scaleY: 1, scaleX: 1, duration: 0.35 }, 4)
      } else {
        gsap.from(el, {
          y: 26,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        })
      }
    }, el)

    return () => ctx.revert()
  }, [variant, side])

  return (
    <svg
      ref={ref}
      className={cn('aq', className)}
      viewBox="0 0 120 112"
      style={{ width: size, height: 'auto' }}
      aria-hidden="true"
      focusable="false"
    >
      <g className="aq-inner">
        {/* tail */}
        <path
          className="aq-tail"
          d="M88 86 Q106 84 110 70"
          stroke="#8A6244"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        {/* ears — blush inner, twitch on a bottom pivot */}
        <g className="aq-ear aq-ear--l">
          <circle cx="41" cy="19" r="9.5" fill="#A9855D" />
          <circle cx="41" cy="20" r="4.8" fill="#F0DCCC" />
        </g>
        <g className="aq-ear aq-ear--r">
          <circle cx="79" cy="19" r="9.5" fill="#A9855D" />
          <circle cx="79" cy="20" r="4.8" fill="#F0DCCC" />
        </g>
        {/* body */}
        <ellipse cx="60" cy="82" rx="30" ry="24" fill="#A9855D" />
        <ellipse cx="60" cy="88" rx="17" ry="13" fill="#D8BE94" />
        {/* feet */}
        <ellipse cx="42" cy="103" rx="10" ry="5.5" fill="#8A6244" />
        <ellipse cx="78" cy="103" rx="10" ry="5.5" fill="#8A6244" />
        {/* arms */}
        <ellipse cx="38" cy="80" rx="6" ry="9" fill="#8A6244" transform="rotate(18 38 80)" />
        <ellipse cx="82" cy="80" rx="6" ry="9" fill="#8A6244" transform="rotate(-18 82 80)" />
        {/* head */}
        <circle cx="60" cy="40" r="25" fill="#A9855D" />
        {/* cheeks */}
        <ellipse cx="42" cy="46" rx="5" ry="3.5" fill="#F0DCCC" opacity="0.55" />
        <ellipse cx="78" cy="46" rx="5" ry="3.5" fill="#F0DCCC" opacity="0.55" />
        {/* eyes — blink via scaleY */}
        <g className="aq-eye">
          <circle cx="50" cy="37" r="3.4" fill="#241608" />
          <circle cx="51.2" cy="35.8" r="1.1" fill="#FBF8F2" />
        </g>
        <g className="aq-eye">
          <circle cx="70" cy="37" r="3.4" fill="#241608" />
          <circle cx="71.2" cy="35.8" r="1.1" fill="#FBF8F2" />
        </g>
        {/* muzzle, nose, the grin */}
        <ellipse cx="60" cy="48" rx="10.5" ry="8" fill="#D8BE94" />
        <ellipse cx="60" cy="44.5" rx="3.2" ry="2.3" fill="#4E3526" />
        <path
          d="M52.5 50 Q60 57 67.5 50"
          stroke="#4E3526"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  )
}
