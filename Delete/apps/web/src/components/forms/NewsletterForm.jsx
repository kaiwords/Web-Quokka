import { Check, Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import { submitNewsletter } from '../../lib/api'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    setErrorMsg('')
    try {
      await submitNewsletter({ email })
      setStatus('success')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-sky-600 dark:text-sky-300">
        <Check className="h-4 w-4" aria-hidden="true" />
        Thanks for subscribing!
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full min-w-0 rounded-full border-2 border-sand-200 bg-white/80 px-4 py-2 text-sm text-sand-900 outline-none transition-colors focus:border-sky-500 dark:border-ink-600 dark:bg-ink-800/80 dark:text-cream-50 dark:focus:border-sky-400"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          aria-label="Subscribe"
          className="flex shrink-0 items-center justify-center rounded-full bg-sky-500 p-2.5 text-cream-50 transition-colors hover:bg-sky-600 disabled:opacity-60"
        >
          {status === 'loading' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {status === 'error' && <p className="mt-2 text-xs text-red-500">{errorMsg}</p>}
    </form>
  )
}
