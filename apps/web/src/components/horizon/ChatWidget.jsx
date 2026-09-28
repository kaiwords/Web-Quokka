import { useCallback, useEffect, useRef, useState } from 'react'
import { submitContactForm } from '../../lib/api'
import { SITE } from '../../lib/constants'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const EMPTY = { name: '', email: '', message: '', website: '' }

/**
 * The floating chat widget: an honest message box dressed as chat. The
 * launcher pill opens a panel with one welcome bubble and a compact composer
 * that posts through the same `/api/public/contact` endpoint (and honeypot
 * convention) as the main enquiry form. There is no bot on the other end —
 * no typing indicators, no simulated replies — the confirmation bubble only
 * reports what actually happened.
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState(EMPTY)
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [sent, setSent] = useState(null) // the delivered enquiry, echoed as bubbles

  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const launcherRef = useRef(null)
  const firstFieldRef = useRef(null)

  const close = useCallback(() => {
    setOpen(false)
    launcherRef.current?.focus()
  }, [])

  // Escape and outside-click both close the panel.
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      }
    }
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, close])

  // Focus moves into the panel on open (after its entry animation kicks off).
  useEffect(() => {
    if (!open) return undefined
    const timer = setTimeout(() => {
      ;(firstFieldRef.current || panelRef.current)?.focus()
    }, 60)
    return () => clearTimeout(timer)
  }, [open, status])

  function update(field) {
    return (e) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }))
      if (status === 'error') setStatus('idle')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const name = values.name.trim()
    const email = values.email.trim()
    const message = values.message.trim()

    if (name.length < 2) {
      setStatus('error')
      setErrorMsg('Please tell us your name.')
      return
    }
    if (!EMAIL_RE.test(email)) {
      setStatus('error')
      setErrorMsg('Please enter a valid email address.')
      return
    }
    if (!message) {
      setStatus('error')
      setErrorMsg('Please write a short message.')
      return
    }

    setStatus('loading')
    setErrorMsg('')
    try {
      await submitContactForm({ name, email, message, website: values.website })
      setSent({ name, email, message })
      setValues(EMPTY)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="chat" ref={rootRef}>
      {open && (
        <section
          className="chat-panel"
          role="dialog"
          aria-label={`Send ${SITE.name} a message`}
          ref={panelRef}
          tabIndex={-1}
        >
          <header className="chat-head">
            <img src="/brand/mascot-cream.png" alt="" className="chat-avatar" />
            <div>
              <p className="chat-title">{SITE.name}</p>
              <p className="chat-sub">Leave a message — we usually reply within a day</p>
            </div>
            <button type="button" className="chat-close" onClick={close} aria-label="Close chat">
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className="chat-thread">
            <p className="chat-bubble chat-bubble--bot">
              G&rsquo;day! Tell us what you need and we&rsquo;ll get back to you by email.
            </p>
            {sent && (
              <>
                <p className="chat-bubble chat-bubble--user">{sent.message}</p>
                <p className="chat-bubble chat-bubble--bot">
                  Thanks {sent.name} — your message has been sent. We&rsquo;ll reply to{' '}
                  {sent.email}, usually within a day.
                </p>
              </>
            )}
            {status === 'error' && (
              <p className="chat-bubble chat-bubble--error" role="alert">
                {errorMsg}
              </p>
            )}
          </div>

          {status === 'success' ? (
            <div className="chat-foot">
              <button type="button" className="chat-again" onClick={() => setStatus('idle')}>
                Send another message
              </button>
            </div>
          ) : (
            <form className="chat-form" onSubmit={handleSubmit} noValidate>
              <div className="chat-row">
                <label className="sr-only" htmlFor="chat-name">
                  Your name
                </label>
                <input
                  id="chat-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  required
                  ref={firstFieldRef}
                  value={values.name}
                  onChange={update('name')}
                />
                <label className="sr-only" htmlFor="chat-email">
                  Email
                </label>
                <input
                  id="chat-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  required
                  value={values.email}
                  onChange={update('email')}
                />
              </div>
              <label className="sr-only" htmlFor="chat-message">
                Your message
              </label>
              <textarea
                id="chat-message"
                name="message"
                rows={3}
                placeholder="How can we help?"
                required
                value={values.message}
                onChange={update('message')}
              />

              {/* Honeypot — same convention as the main enquiry form. */}
              <div aria-hidden="true" className="field--hp">
                <label htmlFor="chat-website">Website</label>
                <input
                  id="chat-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.website}
                  onChange={update('website')}
                />
              </div>

              <button type="submit" className="chat-send" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}

          <p className="sr-only" aria-live="polite">
            {status === 'success' ? 'Message sent.' : ''}
          </p>
        </section>
      )}

      <button
        type="button"
        className="fab-btn fab-btn--quote"
        ref={launcherRef}
        aria-expanded={open}
        aria-haspopup="dialog"
        data-magnetic
        data-cursor={open ? 'Close' : 'Chat'}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="fab-emoji" aria-hidden="true">
          💬
        </span>
        <span className="fab-text">Free quote</span>
        <span className="fab-presence" aria-hidden="true" />
      </button>
    </div>
  )
}
