import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { submitContactForm } from '../../lib/api'
import { BUDGET_OPTIONS, PROJECT_PACKAGES, SERVICE_OPTIONS } from '../../lib/constants'
import { confetti } from '../../lib/horizon'
import { cn } from '../../lib/utils'
import Btn from './Btn'

/** Service options plus the package names, so a "Choose plan" button can preselect one. */
const ALL_SERVICES = [...SERVICE_OPTIONS, ...PROJECT_PACKAGES.map((p) => `${p.name} package`)]

const RULES = {
  name: (v) => v.trim().length >= 2 || 'Please tell us your name.',
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
  service: (v) => !!v || 'Please choose what you need help with.',
  message: (v) => v.trim().length >= 10 || 'A few more words, please (10+ characters).',
}

// `website` is a honeypot: hidden from real users, and a submission that fills
// it is accepted with a 200 and silently dropped server-side (see
// apps/management/src/lib/publicForms.ts). It lives in EMPTY so it is sent with
// every submit and cleared on success like any other field.
const EMPTY = {
  name: '',
  company: '',
  email: '',
  phone: '',
  service: '',
  budget: '',
  message: '',
  website: '',
}

/**
 * The enquiry form, Horizon Drift style: inline validation that only nags once
 * you've had a go at a field, a shake when a submit is rejected, and confetti
 * from the send button when it goes through. Posts to the WebQuokka backend via
 * `submitContactForm`.
 */
export default function HorizonContactForm() {
  const [searchParams] = useSearchParams()
  const [values, setValues] = useState(() => ({
    ...EMPTY,
    service: searchParams.get('service') || '',
  }))
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [shake, setShake] = useState(false)

  const cardRef = useRef(null)
  const submitRef = useRef(null)
  const successRef = useRef(null)
  const liveRef = useRef(null)

  // Pricing panels announce a chosen package; the select follows along.
  useEffect(() => {
    const onPlan = (e) => {
      setValues((prev) => ({ ...prev, service: e.detail }))
      setErrors((prev) => ({ ...prev, service: undefined }))
    }
    window.addEventListener('horizon:plan', onPlan)
    return () => window.removeEventListener('horizon:plan', onPlan)
  }, [])

  useEffect(() => {
    if (status === 'success') successRef.current?.focus({ preventScroll: true })
  }, [status])

  function checkField(name, value) {
    const rule = RULES[name]
    if (!rule) return true
    const res = rule(value)
    setErrors((prev) => ({ ...prev, [name]: res === true ? undefined : res }))
    return res === true
  }

  function update(field) {
    return (e) => {
      const { value } = e.target
      setValues((prev) => ({ ...prev, [field]: value }))
      if (errors[field]) checkField(field, value)
    }
  }

  function onBlur(field) {
    return (e) => {
      if (e.target.value) checkField(field, e.target.value)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const bad = Object.keys(RULES).filter((name) => !checkField(name, values[name]))
    if (bad.length) {
      setShake(false)
      requestAnimationFrame(() => setShake(true))
      cardRef.current?.querySelector(`[name="${bad[0]}"]`)?.focus()
      if (liveRef.current) {
        liveRef.current.textContent = `Please fix ${bad.length} field${bad.length > 1 ? 's' : ''}.`
      }
      return
    }

    setStatus('loading')
    setErrorMsg('')
    const rect = submitRef.current?.getBoundingClientRect()
    try {
      await submitContactForm(values)
      setStatus('success')
      setValues(EMPTY)
      if (liveRef.current) {
        liveRef.current.textContent = "Thanks — message sent! We'll be in touch within 24 hours."
      }
      if (rect) confetti(rect.left + rect.width / 2, rect.top + rect.height / 2)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
    }
  }

  const invalid = (name) => (errors[name] ? 'is-invalid' : '')

  if (status === 'success') {
    return (
      <div className="form-card" data-reveal>
        <div className="form-success" ref={successRef} tabIndex={-1}>
          <span className="success-mark" aria-hidden="true">
            ✓
          </span>
          <h3>Thanks — message sent!</h3>
          <p>
            We&rsquo;ve got your enquiry and will be in touch within one business day. Keep an eye
            on your inbox.
          </p>
          <Btn variant="ghost" onClick={() => setStatus('idle')} cursor="Again">
            Send another enquiry
          </Btn>
        </div>
        <p className="sr-only" aria-live="polite" ref={liveRef} />
      </div>
    )
  }

  return (
    <div className={cn('form-card', shake && 'is-shake')} ref={cardRef} data-reveal>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className={cn('field', invalid('name'))}>
          <label htmlFor="f-name">
            Your name <span aria-hidden="true">*</span>
          </label>
          <input
            id="f-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-describedby="e-name"
            aria-invalid={errors.name ? 'true' : 'false'}
            value={values.name}
            onChange={update('name')}
            onBlur={onBlur('name')}
          />
          <p className="field-error" id="e-name">
            {errors.name || ''}
          </p>
        </div>

        <div className="field">
          <label htmlFor="f-business">
            Business name <span className="opt">(optional)</span>
          </label>
          <input
            id="f-business"
            name="company"
            type="text"
            autoComplete="organization"
            value={values.company}
            onChange={update('company')}
          />
        </div>

        <div className={cn('field', invalid('email'))}>
          <label htmlFor="f-email">
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id="f-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby="e-email"
            aria-invalid={errors.email ? 'true' : 'false'}
            value={values.email}
            onChange={update('email')}
            onBlur={onBlur('email')}
          />
          <p className="field-error" id="e-email">
            {errors.email || ''}
          </p>
        </div>

        <div className="field">
          <label htmlFor="f-phone">
            Phone <span className="opt">(optional)</span>
          </label>
          <input
            id="f-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={update('phone')}
          />
        </div>

        <div className={cn('field field--full field--select', invalid('service'))}>
          <label htmlFor="f-service">
            What can we help with? <span aria-hidden="true">*</span>
          </label>
          <select
            id="f-service"
            name="service"
            required
            aria-describedby="e-service"
            aria-invalid={errors.service ? 'true' : 'false'}
            value={values.service}
            onChange={update('service')}
            onBlur={onBlur('service')}
          >
            <option value="">Choose a service…</option>
            {ALL_SERVICES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <p className="field-error" id="e-service">
            {errors.service || ''}
          </p>
        </div>

        <div className="field field--full field--select">
          <label htmlFor="f-budget">
            Budget range <span className="opt">(optional)</span>
          </label>
          <select id="f-budget" name="budget" value={values.budget} onChange={update('budget')}>
            <option value="">Not sure yet</option>
            {BUDGET_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className={cn('field field--full', invalid('message'))}>
          <label htmlFor="f-message">
            Tell us about your project <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="f-message"
            name="message"
            rows="3"
            required
            aria-describedby="e-message"
            aria-invalid={errors.message ? 'true' : 'false'}
            value={values.message}
            onChange={update('message')}
            onBlur={onBlur('message')}
          />
          <p className="field-error" id="e-message">
            {errors.message || ''}
          </p>
        </div>

        {/* Honeypot. Positioned off-screen rather than display:none, which
            some bots are built to skip, and kept out of the tab order. */}
        <div aria-hidden="true" className="field--hp">
          <label htmlFor="f-website">Website</label>
          <input
            id="f-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={update('website')}
          />
        </div>

        {status === 'error' && (
          <p className="field-error field--full" role="alert">
            {errorMsg}
          </p>
        )}

        <div className="form-foot field--full">
          <p className="form-hint">Fields marked * are required.</p>
          <Btn
            ref={submitRef}
            type="submit"
            cursor="Send"
            icon={status === 'loading' ? '◌' : '→'}
            className={cn(status === 'loading' && 'is-loading')}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Sending…' : 'Send Enquiry'}
          </Btn>
        </div>
      </form>
      <p className="sr-only" aria-live="polite" ref={liveRef} />
    </div>
  )
}
