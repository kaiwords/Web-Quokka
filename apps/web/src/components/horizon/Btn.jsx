import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

const VARIANTS = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  forest: 'btn-forest',
}

const SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

/**
 * The Horizon Drift button: a pill whose fill wipes in from the left on hover,
 * drifts toward the cursor (magnetic), and ripples from the click point. Renders
 * as a router Link, a plain anchor or a button depending on what it's given.
 */
export default function Btn({
  to,
  href,
  variant = 'primary',
  size = 'md',
  float = false,
  block = false,
  className,
  cursor,
  icon,
  iconBack = false,
  children,
  magnetic = true,
  ...props
}) {
  const classes = cn(
    'btn',
    VARIANTS[variant],
    SIZES[size],
    float && 'btn-float',
    block && 'btn-block',
    className,
  )

  const shared = {
    className: classes,
    ...(magnetic ? { 'data-magnetic': '' } : null),
    ...(cursor ? { 'data-cursor': cursor } : null),
    ...props,
  }

  const mark = icon ? (
    <span className={cn('btn-icon', iconBack && 'btn-icon--back')} aria-hidden="true">
      {icon}
    </span>
  ) : null

  // A back-pointing icon leads, everything else trails the label.
  const inner = (
    <>
      {iconBack ? mark : null}
      <span className="btn-label">{children}</span>
      {iconBack ? null : mark}
    </>
  )

  if (to) {
    return (
      <Link to={to} {...shared}>
        {inner}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} {...shared}>
        {inner}
      </a>
    )
  }
  return (
    <button type="button" {...shared}>
      {inner}
    </button>
  )
}
