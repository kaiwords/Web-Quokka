import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

/**
 * The shared button used across the inner routes. It renders the Horizon Drift
 * `.btn` pill — fill wiping in from the left, magnetic drift toward the cursor
 * and a ripple on click — while keeping the older variant/size API so existing
 * call sites read the same.
 */
const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-forest',
  outline: 'btn-ghost',
  ghost: 'btn-ghost',
}

const SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export default function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  glow = false,
  cursor,
  ...props
}) {
  const classes = cn(
    'btn',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size],
    glow && 'animate-pulse-glow',
    className,
  )

  const shared = {
    className: classes,
    'data-magnetic': '',
    ...(cursor ? { 'data-cursor': cursor } : null),
    ...props,
  }

  // Content has to sit above the wiping fill, which owns z-index 0 inside the pill.
  const label = <span className="btn-label inline-flex items-center gap-2">{children}</span>

  if (to) {
    return (
      <Link to={to} {...shared}>
        {label}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} {...shared}>
        {label}
      </a>
    )
  }

  const Tag = as || 'button'
  return (
    <Tag {...(Tag === 'button' ? { type: 'button' } : null)} {...shared}>
      {label}
    </Tag>
  )
}
