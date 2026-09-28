import { cn } from '../../lib/utils'

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-cream-400 bg-cream-50/80 p-6 shadow-card backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
