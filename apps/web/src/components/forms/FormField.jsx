import { useId, useState } from 'react'
import { cn } from '../../lib/utils'

export function FormField({
  label,
  type = 'text',
  as = 'input',
  value,
  onChange,
  name,
  required = false,
  error,
  rows = 4,
  className,
}) {
  const [focused, setFocused] = useState(false)
  const id = useId()
  const floated = focused || String(value ?? '').length > 0
  const Tag = as

  return (
    <div className={cn('relative', className)}>
      <Tag
        id={id}
        name={name}
        type={as === 'input' ? type : undefined}
        rows={as === 'textarea' ? rows : undefined}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          'peer w-full rounded-xl border-2 bg-white/70 px-4 pb-2.5 pt-5 text-sand-900 outline-none transition-colors duration-200 dark:bg-ink-800/70 dark:text-cream-50',
          'border-sand-200 focus:border-sky-500 dark:border-ink-600 dark:focus:border-sky-400',
          error && 'border-red-400 focus:border-red-500',
          as === 'textarea' && 'resize-none',
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute left-4 origin-left text-sand-500 transition-all duration-200 dark:text-sand-400',
          floated ? 'top-2 text-xs font-medium text-sky-600 dark:text-sky-300' : 'top-1/2 -translate-y-1/2 text-base',
        )}
      >
        {label}
        {required && <span className="text-sky-500"> *</span>}
      </label>
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute bottom-0 left-4 right-4 h-0.5 origin-center scale-x-0 bg-sky-500 transition-transform duration-300',
          focused && 'scale-x-100',
        )}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}

export function SelectField({ label, value, onChange, name, options, required = false, className }) {
  const [focused, setFocused] = useState(false)
  const id = useId()
  const floated = focused || Boolean(value)

  return (
    <div className={cn('relative', className)}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        className={cn(
          'peer w-full appearance-none rounded-xl border-2 border-sand-200 bg-white/70 px-4 pb-2.5 pt-5 text-sand-900 outline-none transition-colors duration-200',
          'focus:border-sky-500 dark:border-ink-600 dark:bg-ink-800/70 dark:text-cream-50 dark:focus:border-sky-400',
        )}
      >
        <option value="" disabled hidden />
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute left-4 origin-left text-sand-500 transition-all duration-200 dark:text-sand-400',
          floated ? 'top-2 text-xs font-medium text-sky-600 dark:text-sky-300' : 'top-1/2 -translate-y-1/2 text-base',
        )}
      >
        {label}
        {required && <span className="text-sky-500"> *</span>}
      </label>
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute bottom-0 left-4 right-4 h-0.5 origin-center scale-x-0 bg-sky-500 transition-transform duration-300',
          focused && 'scale-x-100',
        )}
      />
    </div>
  )
}
