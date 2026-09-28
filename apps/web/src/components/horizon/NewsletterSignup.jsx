import { useState } from 'react'
import { submitNewsletter } from '../../lib/api'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Compact newsletter signup for the footers. Posts to the management app's
 * `/api/public/newsletter` (which upserts a NewsletterSubscriber and powers
 * the emailed unsubscribe links). `website` is the same honeypot convention
 * as the enquiry form — hidden from people, silently dropped server-side
 * when a bot fills it.
 */
export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }
    setStatus('loading')
    setMessage('')
    try {
      await submitNewsletter({ email: email.trim(), website })
      setStatus('success')
      setMessage("You're on the list — thanks!")
      setEmail('')
      setWebsite('')
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Could not subscribe. Please try again.')
    }
  }

  return (
    <form className="newsletter" onSubmit={handleSubmit} noValidate>
      <label className="newsletter-label" htmlFor="nl-email">
        Tips &amp; updates, no spam
      </label>
      <div className="newsletter-row">
        <input
          id="nl-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@business.com.au"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status === 'error') setStatus('idle')
          }}
          aria-describedby="nl-status"
          aria-invalid={status === 'error' ? 'true' : 'false'}
        />
        <button
          type="submit"
          className="newsletter-btn"
          disabled={status === 'loading'}
          data-cursor="Join"
        >
          {status === 'loading' ? '…' : 'Subscribe'}
        </button>
      </div>

      {/* Honeypot — off-screen, out of the tab order, invisible to people. */}
      <div aria-hidden="true" className="field--hp">
        <label htmlFor="nl-website">Website</label>
        <input
          id="nl-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <p
        id="nl-status"
        className={`newsletter-status${status === 'error' ? ' is-error' : ''}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </p>
    </form>
  )
}
