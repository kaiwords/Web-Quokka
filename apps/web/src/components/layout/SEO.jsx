import { useEffect } from 'react'
import { SITE } from '../../lib/constants'

const SITE_URL = 'https://webquokka.com.au'

function setMeta(attr, key, content) {
  let el = document.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setJsonLd(id, data) {
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

/**
 * Lightweight per-page SEO: document title, meta description, canonical URL,
 * Open Graph / Twitter tags, and LocalBusiness JSON-LD (no react-helmet dependency).
 */
export default function SEO({ title, description, path = '/' }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} | Perth Web Development Agency`
    const desc =
      description ||
      'WebQuokka builds friendly, fast, professional websites and web apps for Perth businesses — from MVP to launch, plus ongoing maintenance and support.'
    const url = `${SITE_URL}${path}`

    document.title = fullTitle
    setMeta('name', 'description', desc)
    setLink('canonical', url)

    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', SITE.name)
    setMeta('property', 'og:image', `${SITE_URL}/og-image.png`)

    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', desc)
    setMeta('name', 'twitter:image', `${SITE_URL}/og-image.png`)

    setJsonLd('local-business-schema', {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: SITE.name,
      description: desc,
      email: SITE.email,
      telephone: '+61414093339',
      url: SITE_URL,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Perth',
        addressRegion: 'WA',
        addressCountry: 'AU',
      },
    })
  }, [title, description, path])

  return null
}
