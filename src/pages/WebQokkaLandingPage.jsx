import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/* ─────────────────────────── NAV ─────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [particles, setParticles] = useState([])
  const idRef = useRef(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Services', href: '#services' },
    { label: 'Process', href: '#process' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Blog', href: '#blog' },
    { label: 'Contact', href: '#contact' },
  ]

  function spawnParticles(e, label) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const dirs = [
      { dx: -30, dy: -40 }, { dx: 30, dy: -40 }, { dx: -50, dy: -20 },
      { dx: 50, dy: -20 }, { dx: -20, dy: 30 }, { dx: 20, dy: 30 },
    ]
    const count = 2 + Math.floor(Math.random() * 2)
    const newPs = dirs.slice(0, count).map(({ dx, dy }) => {
      const id = ++idRef.current
      return { id, x, y, label, dx: dx + (Math.random() - 0.5) * 20, dy: dy + (Math.random() - 0.5) * 20 }
    })
    setParticles(p => [...p, ...newPs])
    setTimeout(() => setParticles(p => p.filter(pt => !newPs.find(n => n.id === pt.id))), 700)
  }

  function handleNavClick(e, href, label) {
    e.preventDefault()
    spawnParticles(e, label)
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
      setMenuOpen(false)
    }, 200)
  }

  const navBg = scrolled ? 'rgba(17,24,22,0.95)' : 'linear-gradient(160deg, #111816 0%, #1c1008 40%, #2a1205 100%)'

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
        <style>{`@keyframes navpop{0%{opacity:1;transform:translate(-50%,-50%) translate(0,0) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) translate(var(--dx),var(--dy)) scale(0.5)}}`}</style>
        {particles.map(p => (
          <span key={p.id} style={{ position: 'fixed', left: p.x, top: p.y, transform: 'translate(-50%,-50%)', fontSize: 11, fontWeight: 700, color: '#c2773a', fontFamily: "'Bricolage Grotesque', sans-serif", animation: 'navpop 0.65s ease-out forwards', '--dx': `${p.dx}px`, '--dy': `${p.dy}px` }}>
            {p.label}
          </span>
        ))}
      </div>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: navBg, backdropFilter: scrolled ? 'blur(12px)' : 'none', padding: '0 32px', transition: 'background 0.4s', boxShadow: scrolled ? '0 2px 24px rgba(0,0,0,0.3)' : 'none' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/images/quokka-logo.svg" alt="Web Quokka" style={{ height: 36 }} />
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>Web Quokka</span>
          </a>

          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {navLinks.map(l => (
              <a key={l.label} href={l.href} className="nav-link" style={{ color: 'rgba(255,255,255,0.85)' }} onClick={e => handleNavClick(e, l.href, l.label)}>{l.label}</a>
            ))}
          </div>

          <a href="#contact" className="btn-brown hide-mobile" style={{ padding: '10px 22px', fontSize: 14 }} onClick={e => handleNavClick(e, '#contact', 'Quote')}>Get a Free Quote ↗</a>

          <button className="hamburger" style={{ color: '#fff' }} onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <span style={{ transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none', transition: 'transform 0.2s' }} />
            <span style={{ opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
            <span style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {menuOpen && (
          <div style={{ background: '#111816', padding: '16px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {navLinks.map(l => (
              <a key={l.label} href={l.href} style={{ display: 'block', color: 'rgba(255,255,255,0.85)', padding: '12px 0', textDecoration: 'none', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)' }} onClick={e => handleNavClick(e, l.href, l.label)}>{l.label}</a>
            ))}
            <a href="#contact" className="btn-brown" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={e => handleNavClick(e, '#contact', 'Quote')}>Get a Free Quote ↗</a>
          </div>
        )}
      </nav>
    </>
  )
}

/* ─────────────────────────── WEBSITE MOCKUP ─────────────────────────── */
function WebsiteMockup() {
  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)', background: '#1a1a2e' }}>
      {/* Browser chrome */}
      <div style={{ background: '#2a2a3e', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9 }}>🔒</span> webquokka.com.au
        </div>
      </div>

      {/* Page content */}
      <div style={{ background: '#f8faf9', padding: 0, minHeight: 300 }}>
        {/* Mock nav */}
        <div style={{ background: '#111816', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#c2773a' }} />
            <div style={{ width: 60, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.4)' }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[40, 36, 44, 38].map((w, i) => <div key={i} style={{ width: w, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.2)' }} />)}
          </div>
          <div style={{ width: 64, height: 22, borderRadius: 11, background: '#c2773a', opacity: 0.9 }} />
        </div>

        {/* Mock hero */}
        <div style={{ background: 'linear-gradient(135deg, #111816 0%, #2a1205 100%)', padding: '28px 20px 24px' }}>
          <div style={{ width: '55%', height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.15)', marginBottom: 10 }} />
          <div style={{ width: '80%', height: 18, borderRadius: 5, background: 'rgba(255,255,255,0.5)', marginBottom: 8 }} />
          <div style={{ width: '65%', height: 18, borderRadius: 5, background: 'rgba(255,255,255,0.35)', marginBottom: 20 }} />
          <div style={{ width: '75%', height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.12)', marginBottom: 6 }} />
          <div style={{ width: '60%', height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.12)', marginBottom: 24 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 90, height: 28, borderRadius: 14, background: '#fff' }} />
            <div style={{ width: 80, height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }} />
          </div>
        </div>

        {/* Mock service cards */}
        <div style={{ padding: '16px 20px', background: '#fdf5ec' }}>
          <div style={{ width: 100, height: 8, borderRadius: 4, background: '#c2773a', opacity: 0.5, marginBottom: 12 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: 'linear-gradient(135deg, #fff 0%, #fde8d0 100%)', borderRadius: 8, padding: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: '#c2773a', opacity: 0.4, marginBottom: 6 }} />
                <div style={{ width: '80%', height: 6, borderRadius: 3, background: '#0a0f0d', opacity: 0.4, marginBottom: 4 }} />
                <div style={{ width: '100%', height: 5, borderRadius: 3, background: '#9ca3af', opacity: 0.5, marginBottom: 3 }} />
                <div style={{ width: '70%', height: 5, borderRadius: 3, background: '#9ca3af', opacity: 0.5 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Mock CTA strip */}
        <div style={{ background: '#c2773a', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ width: '50%', height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.5)' }} />
          <div style={{ width: 70, height: 22, borderRadius: 11, background: '#fff', opacity: 0.9 }} />
        </div>
      </div>

      {/* Floating badge */}
      <div style={{ position: 'absolute', bottom: 20, right: -16, background: '#fff', borderRadius: 12, padding: '10px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #c2773a, #e8a96a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✓</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0f0d' }}>Site Live!</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>14-day delivery</div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── HERO ─────────────────────────── */
function HeroSection() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [])
  const stats = [['50+', 'Projects delivered'], ['100%', 'Client satisfaction'], ['24h', 'Response time']]

  return (
    <section style={{ background: 'linear-gradient(160deg, #111816 0%, #1c1008 40%, #2a1205 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 32px 80px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '15%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, #fde8d0 0%, transparent 70%)', opacity: 0.06, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, #f5dbb8 0%, transparent 70%)', opacity: 0.04, pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 60, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 580, flex: '1 1 400px' }}>
          <div className={`fade-up ${visible ? 'visible' : ''}`} style={{ marginBottom: 20 }}>
            <span style={{ display: 'inline-block', background: 'rgba(194,119,58,0.15)', border: '1px solid rgba(194,119,58,0.3)', borderRadius: 100, padding: '6px 16px', fontSize: 13, fontWeight: 600, color: '#e8a96a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Websites for every business</span>
          </div>

          <h1 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(42px, 5vw, 68px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Every business deserves a{' '}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              website
              <svg viewBox="0 0 200 8" preserveAspectRatio="none" style={{ position: 'absolute', bottom: -6, left: 0, width: '100%', height: 8 }}>
                <path d="M0 6 Q100 0 200 6" stroke="#c2773a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            {' '}that works.
          </h1>

          <p className={`fade-up d2 ${visible ? 'visible' : ''}`} style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 40, maxWidth: 580 }}>
            We build affordable, high-quality websites and apps for small businesses — so you can focus on what you do best. No bloat, no jargon, no surprises.
          </p>

          <div className={`fade-up d3 ${visible ? 'visible' : ''}`} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 64 }}>
            <a href="#contact" className="btn-dark">Start Your Project →</a>
            <a href="#services" className="btn-outline">View Services</a>
          </div>

          <div className={`fade-up d4 ${visible ? 'visible' : ''}`} style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            {stats.map(([num, label]) => (
              <div key={label}>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Browser mockup */}
        <div className={`fade-up d3 ${visible ? 'visible' : ''}`} style={{ flex: '1 1 440px', maxWidth: 600 }}>
          <WebsiteMockup />
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── SERVICES ─────────────────────────── */
function ServicesSection() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const services = [
    { icon: '🌐', title: 'Website Design & Development', desc: 'Beautiful, fast, and SEO-friendly websites tailored to your brand. From landing pages to complex multi-page sites.', badge: 'Most Popular' },
    { icon: '🛒', title: 'E-Commerce Development', desc: 'Sell online with confidence. We build stores that are easy to manage and optimised for conversions.' },
    { icon: '⚙️', title: 'Web Application Development', desc: 'Custom web apps built to solve real business problems. Scalable, secure, and user-friendly.' },
    { icon: '📱', title: 'Mobile App Development', desc: 'Cross-platform mobile apps that feel native. Built with modern tools for iOS and Android.' },
    { icon: '🔧', title: 'Website & App Maintenance', desc: "We keep your digital presence running smoothly — updates, security patches, and performance monitoring." },
    { icon: '☁️', title: 'Hosting & Backend', desc: "Fast, reliable, and scalable hosting powered by modern cloud infrastructure. We handle it so you don't have to." },
  ]

  return (
    <section id="services" ref={ref} style={{ background: 'linear-gradient(160deg, #f8faf9 0%, #fdf5ec 50%, #f8faf9 100%)', padding: '100px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p className={`fade-up ${visible ? 'visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#c2773a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>What we do</p>
          <h2 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#0a0f0d', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Services built for <span style={{ color: '#c2773a' }}>real businesses</span>
          </h2>
          <p className={`fade-up d2 ${visible ? 'visible' : ''}`} style={{ fontSize: 17, color: '#6b7280', marginTop: 16 }}>Everything you need to get online — and stay ahead.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {services.map((s, i) => (
            <div key={s.title} className={`card-lift fade-up ${visible ? 'visible' : ''}`} style={{ transitionDelay: `${0.05 + i * 0.07}s`, background: 'linear-gradient(135deg, #fdf5ec 0%, #fde8d0 100%)', borderRadius: 20, padding: 32, position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
              {s.badge && <span className="pill" style={{ position: 'absolute', top: 20, right: 20 }}>{s.badge}</span>}
              <div style={{ fontSize: 32, marginBottom: 16 }}>{s.icon}</div>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, color: '#0a0f0d', marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>{s.desc}</p>
              <a href="#contact" style={{ fontSize: 14, fontWeight: 600, color: '#c2773a', textDecoration: 'none' }}>Learn more →</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── WHY US ─────────────────────────── */
function WhyUsSection() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const reasons = [
    { icon: '💰', title: 'Affordable Pricing', desc: 'Premium quality without the agency price tag. Transparent quotes, no hidden fees — ever.' },
    { icon: '🔄', title: 'Simple Process', desc: 'We cut through the complexity. Our 5-step process takes you from idea to launch without the stress.' },
    { icon: '🤝', title: 'Ongoing Support', desc: "We're with you for the long haul. Post-launch support, updates, and growth features whenever you need them." },
    { icon: '✨', title: 'Modern Design', desc: 'Clean, professional, and conversion-focused. Every site we build is designed to impress and perform.' },
  ]

  return (
    <section style={{ background: '#0a0f0d', padding: '100px 32px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, #c2773a30, transparent 70%)', pointerEvents: 'none' }} />
      <div ref={ref} style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p className={`fade-up ${visible ? 'visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#c2773a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Why Web Quokka</p>
          <h2 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Built different. <span style={{ color: '#c2773a' }}>On purpose.</span>
          </h2>
          <p className={`fade-up d2 ${visible ? 'visible' : ''}`} style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>We obsess over the details so you can focus on running your business.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
          {reasons.map((r, i) => (
            <div key={r.title} className={`card-lift fade-up ${visible ? 'visible' : ''}`} style={{ transitionDelay: `${i * 0.1}s`, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{r.icon}</div>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 10 }}>{r.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── MARQUEE ─────────────────────────── */
function MarqueeSection() {
  const items = ['Website Design', 'E-Commerce', 'Web Apps', 'Mobile Apps', 'SEO', 'Hosting', 'Maintenance', 'UI/UX Design', 'Branding', 'Analytics']
  const doubled = [...items, ...items]
  return (
    <section style={{ background: '#c2773a', padding: '28px 0', overflow: 'hidden' }}>
      <div className="marquee-wrap" style={{ marginBottom: 10 }}>
        <div className="marquee-track marquee-ltr">
          {doubled.map((item, i) => (
            <span key={i} style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 24 }}>
              {item} <span style={{ fontSize: 10, opacity: 0.6 }}>◆</span>
            </span>
          ))}
        </div>
      </div>
      <div className="marquee-wrap">
        <div className="marquee-track marquee-rtl">
          {doubled.map((item, i) => (
            <span key={i} style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.7)', display: 'inline-flex', alignItems: 'center', gap: 24 }}>
              {item} <span style={{ fontSize: 10, opacity: 0.5 }}>◆</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── PROCESS ─────────────────────────── */
function ProcessSection() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const steps = [
    { num: '01', title: 'Discover', desc: 'We learn everything about your business, goals, and audience through a detailed brief and discovery call.' },
    { num: '02', title: 'Design', desc: 'We craft pixel-perfect mockups based on your brand. You get to see and approve everything before a single line of code.' },
    { num: '03', title: 'Build', desc: 'Our team brings the design to life — fast, clean code with performance and accessibility baked in.' },
    { num: '04', title: 'Launch', desc: 'We handle deployment, testing, and final checks. Your site goes live on time, every time.' },
    { num: '05', title: 'Maintain', desc: "Post-launch support, updates, and growth features. We're with you for the long haul." },
  ]

  return (
    <section id="process" ref={ref} style={{ background: 'linear-gradient(160deg, #f8faf9 0%, #fdf5ec 50%, #f8faf9 100%)', padding: '100px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p className={`fade-up ${visible ? 'visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#c2773a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>How it works</p>
          <h2 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 800, color: '#0a0f0d', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Simple process, <span style={{ color: '#c2773a' }}>real results</span>
          </h2>
          <p className={`fade-up d2 ${visible ? 'visible' : ''}`} style={{ fontSize: 17, color: '#6b7280', marginTop: 16 }}>Five clear steps from idea to a live, thriving digital presence.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760, margin: '0 auto' }}>
          {steps.map((s, i) => (
            <div key={s.num} className={`fade-up ${visible ? 'visible' : ''}`} style={{ transitionDelay: `${i * 0.1}s`, display: 'flex', gap: 28, alignItems: 'flex-start', background: 'linear-gradient(135deg, #fdf5ec 0%, #fde8d0 100%)', borderRadius: 20, padding: '28px 32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 40, fontWeight: 800, color: '#c2773a', opacity: 0.3, lineHeight: 1, flexShrink: 0 }}>{s.num}</div>
              <div>
                <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 20, color: '#0a0f0d', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── TESTIMONIALS ─────────────────────────── */
function TestimonialsSection() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const testimonials = [
    { name: 'Sarah Mitchell', role: 'Owner, Bloom Florist', quote: 'Web Quokka built our online store in just two weeks. Sales went up 40% in the first month. They made the whole process easy and stress-free.' },
    { name: 'James Torres', role: 'Founder, Torres Plumbing Co.', quote: "I was sceptical at first, but the team delivered a professional site that actually gets us new leads. Best investment we've made." },
    { name: 'Priya Nair', role: 'CEO, NairFit Studio', quote: "Our booking app is slick, fast, and our clients love it. The ongoing support has been incredible — they're always there when we need them." },
    { name: 'Marcus Lee', role: 'Director, Lee & Associates', quote: "From design to hosting, Web Quokka handled everything. The site looks premium and we didn't have to lift a finger." },
  ]

  return (
    <section id="testimonials" ref={ref} style={{ background: '#0a0f0d', padding: '100px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p className={`fade-up ${visible ? 'visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#c2773a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Client Stories</p>
          <h2 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(28px, 3.5vw, 46px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Trusted by small businesses
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {testimonials.map((t, i) => (
            <div key={t.name} className={`card-lift fade-up ${visible ? 'visible' : ''}`} style={{ transitionDelay: `${i * 0.1}s`, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                {Array.from({ length: 5 }).map((_, j) => <span key={j} style={{ color: '#c2773a', fontSize: 16 }}>★</span>)}
              </div>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 24, fontStyle: 'italic' }}>"{t.quote}"</p>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{t.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{t.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── BLOG ─────────────────────────── */
const blogPosts = [
  {
    emoji: '🔍',
    title: "5 Reasons Your Business Website Isn't Showing Up on Google",
    date: 'Mar 18, 2025',
    readTime: '4 min read',
    desc: "Most small business sites make the same avoidable mistakes. Here's what's holding your rankings back — and how to fix it.",
    content: [
      { type: 'intro', text: "You built the website. You hit publish. You waited. And… nothing. No calls, no form fills, no new customers finding you through search. If this sounds familiar, you're not alone — but you're also not stuck. Most small business websites that don't rank on Google are making the same five fixable mistakes." },
      { type: 'heading', text: '1. You Haven\'t Set Up Google Business Profile' },
      { type: 'body', text: "If you haven't claimed and completed your Google Business Profile — with your address, phone number, opening hours, photos, and category — Google has very little reason to show you in local search results. This is especially critical for service-based businesses. Set this up first. It's free, it's powerful, and it takes less than an hour." },
      { type: 'heading', text: '2. Your Website Has No Keywords on the Page' },
      { type: 'body', text: "Google can't read your mind. If your homepage just says \"Welcome\" with no mention of what you do or where you do it, you're invisible to the algorithm. Every page of your site should clearly state what service you offer and where you're located. \"Affordable plumber in Brisbane\" is infinitely more searchable than \"We're here to help.\"" },
      { type: 'heading', text: '3. Your Site Loads Too Slowly' },
      { type: 'body', text: "Page speed is a direct ranking factor. If your site takes more than 3 seconds to load, Google penalises you in the rankings — and 53% of mobile users abandon sites that take longer than that. Common culprits: uncompressed images, cheap shared hosting, and bloated page builders. Test your site at Google PageSpeed Insights to see where you stand. If your score is below 60, it's time for a rebuild." },
      { type: 'heading', text: '4. You Have Zero Backlinks' },
      { type: 'body', text: "Backlinks — other websites linking to yours — are one of Google's strongest trust signals. A brand new site with no backlinks is essentially unknown to Google's algorithm. Start simple: list your business on directories like Yellow Pages, True Local, and industry-specific sites. Ask suppliers or partners to link to you. Even one or two quality links can make a meaningful difference in your early rankings." },
      { type: 'heading', text: '5. Your Site Isn\'t Mobile-Friendly' },
      { type: 'body', text: "Over 60% of all web traffic now comes from mobile devices. Google uses mobile-first indexing, meaning it primarily looks at the mobile version of your site when deciding where to rank you. If your site looks broken or cramped on a phone, you're being pushed down the results. Test your site on multiple devices. If it doesn't look great on a small screen, you're losing both rankings and customers." },
      { type: 'cta', text: "The good news? All five of these are fixable. Web Quokka builds every site with SEO fundamentals baked in from day one — fast loading, mobile-first design, clean structure, and proper keyword targeting. Want a free SEO audit of your current site?" },
    ],
  },
  {
    emoji: '⚡',
    title: 'First Impressions Take 0.05 Seconds — Make Yours Count',
    date: 'Feb 28, 2025',
    readTime: '5 min read',
    desc: "Research shows users form a visual impression in as little as 50 milliseconds. Here's how to make yours count.",
    content: [
      { type: 'intro', text: "Research from Google found that users form a visual impression of a website in as little as 50 milliseconds — that's 0.05 seconds. Before they've read a single word, they've already decided whether your business looks trustworthy. In a world where your competitor is one click away, that first impression isn't just important. It's everything." },
      { type: 'heading', text: 'What Happens in Those 50 Milliseconds?' },
      { type: 'body', text: "The brain processes visual information before language. In that tiny window, visitors are registering colour, layout, whitespace, and hierarchy. They're asking one subconscious question: does this look credible? A cluttered layout, mismatched fonts, low-quality images, or an outdated design all trigger the same response — distrust. And once that impression is formed, it's very hard to reverse." },
      { type: 'heading', text: 'The Hero Section is Everything' },
      { type: 'body', text: "Your hero section — the very first thing visible above the fold — does the heavy lifting. It needs to instantly communicate what you do, who it's for, and why they should trust you. A strong headline, a clear subheading, a single call-to-action, and a compelling visual. That's the formula. Every element that isn't serving those four goals is wasted space — and potentially damaging your first impression." },
      { type: 'heading', text: 'Trust Signals Matter Immediately' },
      { type: 'body', text: "Logos of clients or media mentions, star ratings, a professional headshot, or even a simple \"Based in Sydney, Australia\" line — these all activate trust before a visitor has consciously decided to trust you. They work because they're social proof, and social proof is hardwired into human psychology. If others trust you, it's safe to trust you." },
      { type: 'heading', text: 'Colour and Typography Do the Talking' },
      { type: 'body', text: "Colour psychology is real and measurable. Blue communicates reliability. Green signals health and growth. Orange drives urgency and energy. The wrong colour palette doesn't just look bad — it sends the wrong message about your brand. Typography works similarly: a mismatched or low-quality font signals unprofessionalism instantly, even to users who couldn't tell you why." },
      { type: 'heading', text: 'Mobile First — Always' },
      { type: 'body', text: "Most of your visitors are on a phone. If your desktop design is beautiful but your mobile experience is cramped, cluttered, or slow — you've already lost them. Design mobile-first, then scale up. The first impression on a 390px screen is the one that matters most for the majority of your audience." },
      { type: 'cta', text: "At Web Quokka, every site we build is designed to earn trust in those first 50 milliseconds. Clean layouts, strong hierarchy, mobile-first — and always built around your specific audience. Want a free review of your current site's first impression?" },
    ],
  },
  {
    emoji: '💸',
    title: 'How a $1,500 Website Generated $40k in Its First Quarter',
    date: 'Feb 10, 2025',
    readTime: '6 min read',
    desc: "A local florist came to us with zero online presence. Here's what we built, why it worked, and the numbers that followed.",
    content: [
      { type: 'intro', text: "When Bloom Florist approached us, they were doing everything by phone and Instagram DMs. They had a loyal local following, a great product, and zero online ordering. Their busiest days — Mother's Day, Valentine's Day, weddings — were chaos. Orders were lost. Customers gave up. Revenue was being left on the table every single week." },
      { type: 'heading', text: 'The Brief' },
      { type: 'body', text: "The owner, Sarah, had one clear goal: stop losing orders. She didn't want anything fancy. She wanted customers to be able to browse arrangements, pick one, and pay — without calling or waiting for a DM reply. Her budget was $1,500. Her timeline was two weeks before Mother's Day." },
      { type: 'heading', text: 'What We Built' },
      { type: 'body', text: "We built a clean, fast e-commerce site on a custom Vite + React stack, connected to a Supabase backend and Stripe for payments. The product catalogue was simple — 18 arrangements, three size options each. A single-page checkout with no account required. Mobile-first, because 80% of her Instagram traffic was on phones. Total build time: 11 days." },
      { type: 'heading', text: 'The Photography Problem' },
      { type: 'body', text: "The original product photos were blurry Instagram shots. We spent half a day coaching Sarah on how to photograph her arrangements using her existing phone and a $30 ring light. Good lighting, clean backgrounds, consistent angles. The difference between blurry phone photos and clean product shots on a white background is enormous in e-commerce. Customers buy with their eyes." },
      { type: 'heading', text: 'The Numbers' },
      { type: 'body', text: "In the first three months after launch: $40,200 in online revenue, 340 orders processed, zero lost to checkout abandonment (we tested obsessively), and a 4.9-star rating from customers who specifically mentioned how easy the ordering process was. The site paid for itself in the first 48 hours." },
      { type: 'heading', text: 'What Actually Made the Difference' },
      { type: 'body', text: "It wasn't the technology. It was removing friction. Every step we took — from no-account checkout, to saved delivery addresses, to instant order confirmation emails — was designed to make buying easier than not buying. The best e-commerce sites don't make people think. They make people click." },
      { type: 'cta', text: "A well-built website isn't a cost. It's an asset that works 24/7. If your business is still relying on phone calls and DMs to take orders, there's a better way. Let's build it." },
    ],
  },
]

function BlogModal({ post, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, maxWidth: 720, width: '100%', padding: '48px 52px', position: 'relative', marginBottom: 40 }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f3f4f6', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>×</button>

        {/* Header */}
        <div style={{ fontSize: 48, marginBottom: 20 }}>{post.emoji}</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{post.date}</span>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>·</span>
          <span style={{ fontSize: 13, color: '#c2773a', fontWeight: 600 }}>{post.readTime}</span>
        </div>
        <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 'clamp(22px, 3vw, 30px)', color: '#0a0f0d', lineHeight: 1.3, marginBottom: 32 }}>{post.title}</h2>

        {/* Content */}
        <div>
          {post.content.map((block, i) => {
            if (block.type === 'intro') return (
              <p key={i} style={{ fontSize: 17, color: '#374151', lineHeight: 1.8, marginBottom: 28, fontWeight: 500 }}>{block.text}</p>
            )
            if (block.type === 'heading') return (
              <h3 key={i} style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 20, color: '#0a0f0d', marginTop: 36, marginBottom: 12 }}>{block.text}</h3>
            )
            if (block.type === 'body') return (
              <p key={i} style={{ fontSize: 16, color: '#4b5563', lineHeight: 1.85, marginBottom: 20 }}>{block.text}</p>
            )
            if (block.type === 'cta') return (
              <div key={i} style={{ background: 'linear-gradient(135deg, #fdf5ec, #fde8d0)', borderRadius: 16, padding: '24px 28px', marginTop: 36 }}>
                <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.75, marginBottom: 20, fontWeight: 500 }}>{block.text}</p>
                <a href="#contact" onClick={onClose} className="btn-brown">Get in touch →</a>
              </div>
            )
            return null
          })}
        </div>
      </div>
    </div>
  )
}

function BlogSection() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const [activePost, setActivePost] = useState(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <>
      {activePost && <BlogModal post={activePost} onClose={() => setActivePost(null)} />}
      <section id="blog" ref={ref} style={{ background: 'linear-gradient(160deg, #f8faf9 0%, #fdf5ec 50%, #f8faf9 100%)', padding: '100px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p className={`fade-up ${visible ? 'visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#c2773a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Blog</p>
            <h2 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(28px, 3.5vw, 46px)', fontWeight: 800, color: '#0a0f0d', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              Insights & resources
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {blogPosts.map((p, i) => (
              <div key={p.title} className={`card-lift fade-up ${visible ? 'visible' : ''}`} onClick={() => setActivePost(p)} style={{ transitionDelay: `${i * 0.1}s`, background: 'linear-gradient(135deg, #fdf5ec 0%, #fde8d0 100%)', borderRadius: 20, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{p.emoji}</div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{p.date}</span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>·</span>
                  <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{p.readTime}</span>
                </div>
                <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, color: '#0a0f0d', lineHeight: 1.4, marginBottom: 12 }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 20, flex: 1 }}>{p.desc}</p>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#c2773a' }}>Read more →</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

/* ─────────────────────────── PRICING ─────────────────────────── */
function PricingSection() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const [tab, setTab] = useState('Website')
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const tabs = ['Website', 'E-Commerce', 'Web App', 'Mobile App', 'Maintenance']

  const packages = {
    Website: [
      { name: 'Starter Package', price: '$699', period: 'one-time', features: ['Up to 5 pages', 'Mobile-responsive design', 'Contact form', 'Basic SEO setup', '1 round of revisions', '14-day delivery', 'Vercel hosting setup'], cta: 'Get Started' },
      { name: 'Growth Package', price: '$1,199', period: 'one-time', popular: true, features: ['Up to 12 pages', 'Custom UI/UX design', 'CMS / blog integration', 'Google Analytics setup', 'On-page SEO', '3 rounds of revisions', '21-day delivery'], cta: 'Get Started' },
      { name: 'Pro Package', price: 'Custom', period: 'project', features: ['Unlimited pages', 'Bespoke UI/UX design', 'Custom integrations & APIs', 'Advanced SEO strategy', 'Priority support', 'Ongoing maintenance', 'Dedicated project manager'], cta: 'Talk to Us' },
    ],
    'E-Commerce': [
      { name: 'Shop Starter', price: '$999', period: 'one-time', features: ['Up to 50 products', 'Payment gateway setup', 'Mobile-responsive design', 'Basic SEO setup', 'Order management', '1 round of revisions', '21-day delivery'], cta: 'Get Started' },
      { name: 'Shop Growth', price: '$1,799', period: 'one-time', popular: true, features: ['Unlimited products', 'Custom storefront design', 'Payment + shipping setup', 'Inventory management', 'Abandoned cart recovery', 'Google Shopping feed', 'Analytics dashboard'], cta: 'Get Started' },
      { name: 'Enterprise Store', price: 'Custom', period: 'project', features: ['Custom e-commerce platform', 'ERP / CRM integrations', 'Multi-currency support', 'Advanced analytics', 'Subscription billing', 'Dedicated account manager', '24/7 priority support'], cta: 'Talk to Us' },
    ],
    'Web App': [
      { name: 'App Starter', price: '$2,499', period: 'one-time', features: ['Up to 10 screens', 'User authentication', 'Basic CRUD operations', 'Responsive design', '1 round of revisions', '30-day delivery'], cta: 'Get Started' },
      { name: 'App Growth', price: '$3,999', period: 'one-time', popular: true, features: ['Unlimited screens', 'Custom UI/UX design', 'REST API integration', 'Role-based access control', 'Real-time data sync', '3rd-party integrations', '3 rounds of revisions'], cta: 'Get Started' },
      { name: 'App Enterprise', price: 'Custom', period: 'project', features: ['Fully custom architecture', 'Scalable cloud backend', 'Advanced integrations', 'Admin dashboard', 'Analytics & reporting', 'Dedicated team', 'Ongoing support'], cta: 'Talk to Us' },
    ],
    'Mobile App': [
      { name: 'App Starter', price: '$3,999', period: 'one-time', features: ['iOS & Android', 'Up to 8 screens', 'User authentication', 'Push notifications', 'App store submission', '30-day delivery'], cta: 'Get Started' },
      { name: 'App Growth', price: '$4,999', period: 'one-time', popular: true, features: ['iOS & Android', 'Unlimited screens', 'Payment integration', 'Real-time features', 'Analytics dashboard', '3 rounds of revisions'], cta: 'Get Started' },
      { name: 'App Enterprise', price: 'Custom', period: 'project', features: ['Cross-platform or native', 'Complex integrations', 'Admin panel', 'Advanced analytics', 'Dedicated project manager', 'Priority support'], cta: 'Talk to Us' },
    ],
    Maintenance: [
      { name: 'Basic Care', price: '$79', period: 'per month', features: ['Monthly updates', 'Security patches', 'Uptime monitoring', 'Monthly report', 'Email support', 'Weekly backups'], cta: 'Get Started' },
      { name: 'Growth Care', price: '$179', period: 'per month', popular: true, features: ['Weekly updates', 'Security patches', 'Performance optimisation', 'Priority support', 'Daily backups', 'Monthly analytics report'], cta: 'Get Started' },
      { name: 'Pro Care', price: '$379', period: 'per month', features: ['Unlimited updates', 'Speed optimisation', 'Dedicated support line', 'Unlimited content updates', 'Real-time backups', 'SEO reporting'], cta: 'Talk to Us' },
    ],
  }

  return (
    <section id="pricing" ref={ref} style={{ background: 'linear-gradient(160deg, #f8faf9 0%, #fdf5ec 50%, #f8faf9 100%)', padding: '100px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p className={`fade-up ${visible ? 'visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#c2773a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Pricing</p>
          <h2 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 800, color: '#0a0f0d', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Simple pricing, <span style={{ color: '#c2773a' }}>no surprises</span>
          </h2>
          <p className={`fade-up d2 ${visible ? 'visible' : ''}`} style={{ fontSize: 17, color: '#6b7280', marginTop: 16 }}>Transparent packages built for businesses of every size. Pay once, own it forever.</p>
        </div>

        <div className={`fade-up d2 ${visible ? 'visible' : ''}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 48 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 22px', borderRadius: 100, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', transition: 'all 0.2s', background: tab === t ? '#c2773a' : '#fff', color: tab === t ? '#fff' : '#6b7280', boxShadow: tab === t ? '0 4px 16px rgba(194,119,58,0.3)' : '0 1px 4px rgba(0,0,0,0.08)' }}>{t}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {packages[tab].map((pkg, i) => (
            <div key={pkg.name} className={`card-lift fade-up ${visible ? 'visible' : ''}`} style={{ transitionDelay: `${i * 0.1}s`, background: pkg.popular ? 'linear-gradient(135deg, #111816, #2a1205)' : '#fff', border: pkg.popular ? '1.5px solid #c2773a' : '1px solid #e5e7eb', borderRadius: 24, padding: '36px 32px', boxShadow: pkg.popular ? '0 8px 32px rgba(194,119,58,0.15)' : '0 4px 20px rgba(0,0,0,0.07)', position: 'relative' }}>
              {pkg.popular && <span className="pill" style={{ position: 'absolute', top: 20, right: 20 }}>Most Popular</span>}
              <div style={{ fontWeight: 700, fontSize: 16, color: pkg.popular ? '#fff' : '#0a0f0d', marginBottom: 8 }}>{pkg.name}</div>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 40, fontWeight: 800, color: pkg.popular ? '#fff' : '#0a0f0d', marginBottom: 4 }}>{pkg.price}</div>
              <div style={{ fontSize: 13, color: pkg.popular ? 'rgba(255,255,255,0.45)' : '#9ca3af', marginBottom: 28 }}>{pkg.period}</div>
              <ul style={{ listStyle: 'none', marginBottom: 32 }}>
                {pkg.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: 14, color: pkg.popular ? 'rgba(255,255,255,0.75)' : '#4b5563' }}>
                    <span style={{ color: '#c2773a', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href="#contact" className={pkg.popular ? 'btn-brown' : 'btn-ghost'} style={{ width: '100%', justifyContent: 'center', textAlign: 'center', display: 'flex' }}>{pkg.cta}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── CONTACT ─────────────────────────── */
function ContactSection() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState({ name: '', business: '', email: '', phone: '', service: '', message: '' })
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const { error } = await supabase.from('enquiries').insert([{
        name: form.name.trim(),
        business: form.business.trim() || null,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        service: form.service,
        message: form.message.trim(),
      }])
      if (error) throw error
      setStatus('success')
    } catch (err) {
      console.error('Supabase error:', err)
      setErrorMsg(err?.message || 'Failed to send your message. Please try again.')
      setStatus('error')
    }
  }

  const serviceOptions = ['Web Design', 'E-Commerce', 'Web Application', 'Mobile App', 'Maintenance', 'Hosting & Backend', 'Not sure yet']

  if (status === 'success') {
    return (
      <section id="contact" style={{ background: '#0a0f0d', padding: '100px 32px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>🎉</div>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Message received!</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 16 }}>Thanks for reaching out. We'll get back to you within 24 hours.</p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Happy with Web Quokka so far? Your Google review helps other small businesses find us — it means the world. 🙏</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://g.page/r/YOUR_GOOGLE_REVIEW_LINK/review" target="_blank" rel="noopener noreferrer" className="btn-brown">Leave a Review ★</a>
            <button className="btn-ghost" onClick={() => { setStatus('idle'); setForm({ name: '', business: '', email: '', phone: '', service: '', message: '' }) }}>Send another message</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" ref={ref} style={{ background: '#0a0f0d', padding: '100px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80, alignItems: 'start' }}>
        <div>
          <p className={`fade-up ${visible ? 'visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#c2773a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Get in touch</p>
          <h2 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Let's build something <span style={{ color: '#c2773a' }}>great together.</span>
          </h2>
          <p className={`fade-up d2 ${visible ? 'visible' : ''}`} style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 40 }}>Tell us about your project and we'll get back to you within 24 hours.</p>
          <div className={`fade-up d3 ${visible ? 'visible' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[['📍', 'Based in', 'Hurstville, NSW, Australia'], ['⚡', 'Response time', 'Within 24 hours']].map(([icon, label, val]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{val}</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 20 }}>✉️</span>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Email</div>
                <a href="mailto:quokkasupport@gmail.com" style={{ fontSize: 15, fontWeight: 600, color: '#c2773a', textDecoration: 'none' }}>quokkasupport@gmail.com</a>
              </div>
            </div>
          </div>
        </div>

        <form className={`fade-up d2 ${visible ? 'visible' : ''}`} onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 24, padding: '40px 36px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your Name *</label>
              <input className="form-input" placeholder="Jane Smith" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Business Name</label>
              <input className="form-input" placeholder="Smith & Co." value={form.business} onChange={e => setForm(f => ({ ...f, business: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email *</label>
              <input className="form-input" type="email" placeholder="jane@example.com" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Phone</label>
              <input className="form-input" placeholder="+61 4xx xxx xxx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Service Needed *</label>
            <select className="form-input" required value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}>
              <option value="">Select a service…</option>
              {serviceOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Tell us about your project *</label>
            <textarea className="form-input" rows={5} placeholder="Briefly describe what you need…" required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 16 }}>{errorMsg}</p>}
          <button type="submit" className="btn-brown" style={{ width: '100%', justifyContent: 'center' }} disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending…' : 'Send Message →'}
          </button>
          <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 12 }}>No spam. No commitment. We'll respond within 24 hours.</p>
        </form>
      </div>
    </section>
  )
}

/* ─────────────────────────── FOOTER ─────────────────────────── */
function Footer() {
  const year = new Date().getFullYear()
  const links = [['Services', '#services'], ['Process', '#process'], ['Pricing', '#pricing'], ['Blog', '#blog'], ['Testimonials', '#testimonials'], ['Contact', '#contact']]
  return (
    <footer style={{ background: '#070b09', padding: '60px 32px 32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40, marginBottom: 48 }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <img src="/images/quokka-logo.svg" alt="Web Quokka" style={{ height: 30 }} />
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16, color: '#fff' }}>Web Quokka</span>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>Affordable, high-quality websites and apps for Australian small businesses.</p>
            <a href="mailto:quokkasupport@gmail.com" style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: '#c2773a', textDecoration: 'none', fontWeight: 600 }}>quokkasupport@gmail.com</a>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Navigation</div>
            {links.map(([label, href]) => (
              <a key={label} href={href} style={{ display: 'block', marginBottom: 10, fontSize: 14, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => (e.target.style.color = '#fff')}
                onMouseLeave={e => (e.target.style.color = 'rgba(255,255,255,0.55)')}
              >{label}</a>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Location</div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>Hurstville, NSW<br />Australia</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>© {year} Web Quokka. All rights reserved.</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Built with ❤️ in Australia</p>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────── PAGE ─────────────────────────── */
export default function WebQokkaLandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <WhyUsSection />
      <MarqueeSection />
      <ProcessSection />
      <TestimonialsSection />
      <BlogSection />
      <PricingSection />
      <ContactSection />
      <Footer />
    </>
  )
}
