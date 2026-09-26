// Public form endpoints on the management app (apps/management), which owns
// the database. Cross-origin, so those routes send CORS headers — see
// apps/management/src/lib/cors.ts and its PUBLIC_SITE_ORIGINS variable.
//
// Set VITE_API_BASE_URL in .env (see .env.example). The localhost fallback is
// what `npm run dev` at the repo root starts the Next app on.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/public'
).replace(/\/$/, '')

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function postJSON(path, data) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch {
    throw new ApiError('Network error — please check your connection and try again.', 0)
  }

  if (!response.ok) {
    let message = 'Something went wrong. Please try again.'
    try {
      const body = await response.json()
      message = body?.error || body?.message || message
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(message, response.status)
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

export function submitContactForm(payload) {
  return postJSON('/contact', payload)
}

export function submitQuoteForm(payload) {
  return postJSON('/quote', payload)
}

export function submitNewsletter(payload) {
  return postJSON('/newsletter', payload)
}
