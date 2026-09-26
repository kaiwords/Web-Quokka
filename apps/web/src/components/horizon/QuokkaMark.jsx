import { cn } from '../../lib/utils'

/**
 * The Horizon Drift logo mark — a lime tile with the quokka face on it.
 *
 * Sizing comes from the `--mark-size` token by default, so the mark scales with
 * the viewport wherever it appears. Pass `size` (any CSS length) to override it
 * for a one-off placement.
 */
export default function QuokkaMark({ className, size, title, ...props }) {
  return (
    <svg
      className={cn('logo-mark', className)}
      style={size ? { width: size, height: size } : undefined}
      viewBox="0 0 40 40"
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
      {...props}
    >
      <rect width="40" height="40" rx="12" fill="#D4FF3A" />
      <circle cx="12.5" cy="13" r="5" fill="#FF6B2C" />
      <circle cx="27.5" cy="13" r="5" fill="#FF6B2C" />
      <circle cx="12.5" cy="13" r="2.3" fill="#FFB08A" />
      <circle cx="27.5" cy="13" r="2.3" fill="#FFB08A" />
      <ellipse cx="20" cy="23" rx="11" ry="10" fill="#FF6B2C" />
      <ellipse cx="20" cy="26.5" rx="6" ry="4.6" fill="#FFD9C4" />
      <circle className="eye" cx="15.8" cy="21" r="1.7" fill="#0A0A0C" />
      <circle className="eye" cx="24.2" cy="21" r="1.7" fill="#0A0A0C" />
      <ellipse cx="20" cy="24.6" rx="1.8" ry="1.3" fill="#0A0A0C" />
      <path
        d="M17.6 27.2 Q20 29.4 22.4 27.2"
        stroke="#0A0A0C"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
