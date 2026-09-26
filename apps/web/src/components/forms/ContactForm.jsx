import { AlertCircle, Loader2, Send } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { submitContactForm } from '../../lib/api'
import { BUDGET_OPTIONS, SERVICE_OPTIONS } from '../../lib/constants'
import Button from '../ui/Button'
import SuccessCheck from '../ui/SuccessCheck'
import { FormField, SelectField } from './FormField'

const initialState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  service: '',
  budget: '',
  message: '',
}

function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please enter your name.'
  if (!values.email.trim()) {
    errors.email = 'Please enter your email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!values.message.trim()) errors.message = 'Tell us a little about your project.'
  return errors
}

export default function ContactForm() {
  const [searchParams] = useSearchParams()
  const [values, setValues] = useState(() => ({
    ...initialState,
    service: searchParams.get('service') || '',
  }))
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  function update(field) {
    return (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validation = validate(values)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setStatus('loading')
    setErrorMsg('')
    try {
      await submitContactForm(values)
      setStatus('success')
      setValues(initialState)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.38, ease: [0.34, 1.3, 0.64, 1] }}
        className="flex flex-col items-center justify-center rounded-3xl border border-sand-200 bg-white/80 px-8 py-16 text-center dark:border-ink-600 dark:bg-ink-800/80"
      >
        <SuccessCheck className="h-16 w-16" />
        <h3 className="mt-4 font-heading text-2xl font-bold text-sand-900 dark:text-cream-50">
          Message sent!
        </h3>
        <p className="mt-2 max-w-sm text-sand-700 dark:text-sand-300">
          Thanks for reaching out — we&rsquo;ll get back to you within one business day.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setStatus('idle')}>
          Send another message
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, ease: [0.2, 0.75, 0.25, 1] }}
      noValidate
      className="space-y-5 rounded-3xl border border-sand-200 bg-white/80 p-6 shadow-sm dark:border-ink-600 dark:bg-ink-800/80 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Full name" name="name" required value={values.name} onChange={update('name')} error={errors.name} />
        <FormField label="Email" type="email" name="email" required value={values.email} onChange={update('email')} error={errors.email} />
        <FormField label="Phone" type="tel" name="phone" value={values.phone} onChange={update('phone')} />
        <FormField label="Company" name="company" value={values.company} onChange={update('company')} />
        <SelectField label="Service interested in" name="service" value={values.service} onChange={update('service')} options={SERVICE_OPTIONS} />
        <SelectField label="Budget range" name="budget" value={values.budget} onChange={update('budget')} options={BUDGET_OPTIONS} />
      </div>

      <FormField label="Tell us about your project" as="textarea" name="message" required value={values.message} onChange={update('message')} error={errors.message} />

      {status === 'error' && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      <Button type="submit" size="lg" disabled={status === 'loading'} className="w-full sm:w-auto">
        {status === 'loading' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" aria-hidden="true" />
            Send message
          </>
        )}
      </Button>
    </motion.form>
  )
}
