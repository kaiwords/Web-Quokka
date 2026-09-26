import { cn } from '../../lib/utils'

/**
 * Minimal, friendly quokka face mark — used subtly as the brand mascot
 * (logo, footer, empty/success states) rather than as a literal illustration.
 */
export default function QuokkaMascot({ className, tone = 'default', size, ...props }) {
  const face = tone === 'inverted' ? 'fill-cream-50' : 'fill-flame-500'
  const inner = tone === 'inverted' ? 'fill-sky-500' : 'fill-flame-400'
  const features = 'fill-ink-900'

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={cn('h-8 w-8', className)}
      style={size ? { width: size, height: size } : undefined}
      role="img"
      aria-label="WebQuokka mascot"
      {...props}
    >
      <circle cx="32" cy="34" r="22" className={face} />
      <circle cx="16" cy="16" r="8" className={face} />
      <circle cx="48" cy="16" r="8" className={face} />
      <circle cx="16" cy="17" r="4.5" className={inner} />
      <circle cx="48" cy="17" r="4.5" className={inner} />
      <circle cx="24" cy="30" r="3.4" className={features} />
      <circle cx="40" cy="30" r="3.4" className={features} />
      <circle cx="25.2" cy="28.7" r="1" className="fill-cream-50" />
      <circle cx="41.2" cy="28.7" r="1" className="fill-cream-50" />
      <ellipse cx="32" cy="38" rx="3" ry="2.2" className={features} />
      <path
        d="M24 44c2.5 3 5.2 4.5 8 4.5s5.5-1.5 8-4.5"
        stroke="currentColor"
        className="text-ink-900"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
