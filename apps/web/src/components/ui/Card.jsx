import { cn } from '../../lib/utils'

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-sand-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm',
        'dark:border-ink-600 dark:bg-ink-800/80',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
