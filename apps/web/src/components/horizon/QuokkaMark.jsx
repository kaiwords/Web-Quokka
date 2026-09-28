import { cn } from '../../lib/utils'

/**
 * The quokka face mark in Brand Guidelines v2 colours — Quokka Brown on a
 * transparent tile, with cream details. The header and footer show the real
 * wordmark asset; this mark remains for small stand-alone placements.
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
      <rect width="40" height="40" rx="12" fill="none" />
      <circle cx="12.5" cy="13" r="5" fill="#422B1C" />
      <circle cx="27.5" cy="13" r="5" fill="#422B1C" />
      <circle cx="12.5" cy="13" r="2.3" fill="#F7F1E6" />
      <circle cx="27.5" cy="13" r="2.3" fill="#F7F1E6" />
      <ellipse cx="20" cy="23" rx="11" ry="10" fill="#422B1C" />
      <ellipse cx="20" cy="26.5" rx="6" ry="4.6" fill="#F7F1E6" />
      <circle className="eye" cx="15.8" cy="21" r="1.7" fill="#F7F1E6" />
      <circle className="eye" cx="24.2" cy="21" r="1.7" fill="#F7F1E6" />
      <ellipse cx="20" cy="24.6" rx="1.8" ry="1.3" fill="#422B1C" />
      <path
        d="M17.6 27.2 Q20 29.4 22.4 27.2"
        stroke="#422B1C"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
