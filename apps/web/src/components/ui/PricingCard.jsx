import NumberFlow from '@number-flow/react'
import { Check } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import Badge from './Badge'
import Button from './Button'
import { cn } from '../../lib/utils'
import { useSwipeRow } from './swipeRowContext'

function parsePrice(price) {
  const match = price.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/)
  if (!match) return { prefix: price, number: null, suffix: '' }
  const [, prefix, numStr, suffix] = match
  return { prefix, number: parseFloat(numStr.replace(/,/g, '')), suffix }
}

export default function PricingCard({ plan, index = 0, ctaLabel = 'Get Started', ctaTo = '/contact' }) {
  const ref = useRef(null)
  const { swipe } = useSwipeRow()
  const inView = useInView(ref, { once: true, amount: swipe ? 0.3 : 0.5 })
  const { prefix, number, suffix } = parsePrice(plan.price)
  const displayValue = inView && number !== null ? number : 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.88 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: swipe ? 0.15 : 0.3 }}
      transition={{ duration: 0.48, delay: swipe ? 0 : index * 0.09, ease: [0.34, 1.2, 0.64, 1] }}
      className={cn(
        'relative flex h-full flex-col rounded-3xl p-7 shadow-sm',
        plan.popular ? 'shadow-xl' : 'border border-sand-200 bg-white/80 dark:border-ink-600 dark:bg-ink-800/80',
      )}
      style={
        plan.popular
          ? {
              backgroundImage:
                'linear-gradient(var(--popular-card-bg), var(--popular-card-bg)), linear-gradient(120deg, var(--color-sky-400), var(--color-sand-400), var(--color-sky-400))',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              border: '2px solid transparent',
              backgroundSize: '100% 100%, 220% 220%',
              animation: 'gradient-border 6s ease infinite',
            }
          : undefined
      }
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" tone="sky">
          Most Popular
        </Badge>
      )}

      <h3 className="font-heading text-xl font-bold text-sand-900 dark:text-cream-50">{plan.name}</h3>
      <p className="mt-2 text-sm text-sand-700 dark:text-sand-300">{plan.description}</p>

      <div className="mt-5">
        {number !== null ? (
          <>
            {prefix.trim() && (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sand-300">
                {prefix.trim().replace(/\$$/, '')}
              </p>
            )}
            <p className="font-heading text-4xl font-extrabold text-cream-50">
              <span className="align-top text-xl">$</span>
              <NumberFlow
                value={displayValue}
                transformTiming={{ duration: 1200, easing: 'ease-out' }}
              />
              {suffix}
            </p>
          </>
        ) : (
          <p className="font-heading text-3xl font-extrabold text-cream-50">{plan.price}</p>
        )}
      </div>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-sand-700 dark:text-sand-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        to={`${ctaTo}?service=${encodeURIComponent(plan.name)}`}
        variant={plan.popular ? 'primary' : 'outline'}
        className="mt-7 w-full"
      >
        {ctaLabel}
      </Button>
    </motion.div>
  )
}
