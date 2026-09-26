import { useEffect, useState } from 'react'
import BackgroundVideo from './BackgroundVideo'
import MainframeNav from './MainframeNav'
import useTypewriter from './useTypewriter'

const VIDEO_SRC = '/video/video1.mp4'
const EMAIL = 'hello@mainframe.co'
const TYPEWRITER_TEXT = 'Glad you stopped in. Good taste tends to find us. Now, what are we building?'
const PILLS = ['Pitch us an idea', 'Come work here', 'Send a brief hello', 'See how we operate']

const FONT_LINKS = [
  {
    id: 'mf-font-heading',
    href: 'https://db.onlinewebfonts.com/c/5ac3fe7c6abd2f62067f266d89671492?family=HelveticaNowDisplay-Medium',
  },
  {
    id: 'mf-font-body',
    href: 'https://db.onlinewebfonts.com/c/1aa3377e489837a26d019bba501e779d?family=HelveticaNowDisplayW01-Rg',
  },
]

const PAGE_STYLE = {
  '--mf-font-heading': "'HelveticaNowDisplay-Medium', 'Helvetica Neue', Arial, sans-serif",
  '--mf-font-body': "'HelveticaNowDisplayW01-Rg', 'Helvetica Neue', Arial, sans-serif",
  fontFamily: 'var(--mf-font-body)',
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="7" height="7" rx="1" stroke="currentColor" />
      <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" />
    </svg>
  )
}

export default function Mainframe() {
  const [pillsVisible, setPillsVisible] = useState(false)
  const { displayed, done } = useTypewriter(TYPEWRITER_TEXT, 38, 600)

  useEffect(() => {
    document.title = 'Mainframe — Creative Agency'
  }, [])

  // Fonts are scoped to this page only, so they're injected here rather than
  // in the global index.html (which serves WebQuokka's own font stack).
  useEffect(() => {
    const created = []
    FONT_LINKS.forEach(({ id, href }) => {
      if (document.getElementById(id)) return
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
      created.push(link)
    })
    return () => created.forEach((link) => link.remove())
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setPillsVisible(true), 400)
    return () => clearTimeout(timer)
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(EMAIL)
    } catch {
      // Clipboard API unavailable (unsupported browser or permissions) — no-op.
    }
  }

  return (
    <div className="relative min-h-screen bg-black text-white" style={PAGE_STYLE}>
      <BackgroundVideo src={VIDEO_SRC} />
      <MainframeNav />

      <section className="relative z-[1] flex h-screen flex-col justify-end overflow-hidden px-5 pb-12 sm:px-8 md:justify-center md:px-10 md:pb-0">
        <div className="relative z-10 max-w-xl">
          <p
            aria-hidden="true"
            className="pointer-events-none mb-5 select-none text-white sm:mb-6"
            style={{
              fontSize: 'clamp(18px, 4vw, 26px)',
              lineHeight: 1.3,
              fontWeight: 400,
              filter: 'blur(4px)',
            }}
          >
            Hey there, meet A.R.I.A,
            <br />
            Mainframe&rsquo;s Adaptive Response Interface Agent
          </p>

          <p
            className="mb-5 text-white sm:mb-6"
            style={{ fontSize: 'clamp(18px, 4vw, 26px)', lineHeight: 1.35, fontWeight: 400, minHeight: 54 }}
          >
            {displayed}
            {!done && (
              <span
                aria-hidden="true"
                className="ml-[2px] inline-block h-[1.1em] w-[2px] animate-[blink_1s_step-end_infinite] bg-white align-middle"
              />
            )}
          </p>

          <div
            className="flex flex-wrap gap-y-1"
            style={{
              opacity: pillsVisible ? 1 : 0,
              transform: pillsVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          >
            {PILLS.map((label) => (
              <button
                key={label}
                type="button"
                className="mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 py-[0.3em] text-[13px] text-black transition-colors duration-200 hover:bg-black hover:text-white sm:px-5 sm:text-[15px]"
              >
                {label}
              </button>
            ))}

            <button
              type="button"
              onClick={handleCopy}
              className="mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white bg-transparent px-4 py-[0.3em] text-[13px] text-white transition-colors duration-200 hover:bg-white hover:text-black sm:gap-3 sm:px-5 sm:text-[15px]"
            >
              <span>
                Reach us: <span className="underline underline-offset-1">{EMAIL}</span>
              </span>
              <CopyIcon />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
