import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import PricingSection from '@/components/ui/pricing-section'
import TestimonialsSection from '@/components/ui/testimonials-section'

/* ─────────────────────────── NAVBAR ─────────────────────────── */
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
    { label: 'Why Us', href: '#why-us' },
    { label: 'Process', href: '#process' },
    { label: 'Testimonials', href: '#testimonials' },
    // { label: 'Blog', href: '#blog' },
    { label: 'Pricing', href: '#pricing' },
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

  const navBg = scrolled ? 'rgba(66, 43, 28, 0.96)' : 'rgba(66, 43, 28, 0.98)'

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
        <style>{`@keyframes navpop{0%{opacity:1;transform:translate(-50%,-50%) translate(0,0) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) translate(var(--dx),var(--dy)) scale(0.5)}}`}</style>
        {particles.map(p => (
          <span key={p.id} style={{ position: 'fixed', left: p.x, top: p.y, transform: 'translate(-50%,-50%)', fontSize: 11, fontWeight: 700, color: '#3A5A40', fontFamily: "'Plus Jakarta Sans', sans-serif", animation: 'navpop 0.65s ease-out forwards', '--dx': `${p.dx}px`, '--dy': `${p.dy}px` }}>
            {p.label}
          </span>
        ))}
      </div>

      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: navBg, backdropFilter: 'blur(12px)', padding: '0 32px', transition: 'background 0.4s', boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.25)' : 'none', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <img src="/images/quokka-logo.svg" alt="Web Quokka" style={{ height: 38, width: 38 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22, color: '#FAF8F5', letterSpacing: '-0.02em', lineHeight: 1 }}>Web Quokka</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#8B9E7D', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 3 }}>Studio Design</span>
            </div>
          </a>

          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {navLinks.map(l => (
              <a key={l.label} href={l.href} className="nav-link" style={{ color: 'rgba(250,248,245,0.88)' }} onClick={e => handleNavClick(e, l.href, l.label)}>{l.label}</a>
            ))}
          </div>

          <a href="#contact" className="btn-sage hide-mobile" style={{ padding: '10px 22px', fontSize: 14 }} onClick={e => handleNavClick(e, '#contact', 'Quote')}>Get a Free Quote ↗</a>

          <button className="hamburger" style={{ color: '#FAF8F5' }} onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <span style={{ transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none', transition: 'transform 0.2s' }} />
            <span style={{ opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
            <span style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {menuOpen && (
          <div style={{ background: '#422b1c', padding: '16px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {navLinks.map(l => (
              <a key={l.label} href={l.href} style={{ display: 'block', color: 'rgba(250,248,245,0.9)', padding: '12px 0', textDecoration: 'none', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }} onClick={e => handleNavClick(e, l.href, l.label)}>{l.label}</a>
            ))}
            <a href="#contact" className="btn-sage" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={e => handleNavClick(e, '#contact', 'Quote')}>Get a Free Quote ↗</a>
          </div>
        )}
      </nav>
    </>
  )
}

/* ─────────────────────────── WEBSITE MOCKUP (INTERACTIVE MINI SITE) ─────────────────────────── */
function WebsiteMockup() {
  const [activeMiniTab, setActiveMiniTab] = useState('home')
  const [miniFormName, setMiniFormName] = useState('')
  const [miniFormSent, setMiniFormSent] = useState(false)
  const miniViewportRef = useRef(null)

  function scrollToMiniSection(sectionId) {
    setActiveMiniTab(sectionId)
    const el = document.getElementById(`mini-${sectionId}`)
    if (el && miniViewportRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(66,43,28,0.45), 0 0 0 1px rgba(255,255,255,0.12)', background: '#422b1c' }}>
      {/* Browser Top Chrome */}
      <div style={{ background: '#312015', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 14px', fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10 }}>🔒</span> www.webquokka.com.au/mini-site
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#FAF8F5', fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: '#3A5A40', letterSpacing: '0.04em' }}>
            ↕ SCROLLABLE MINI SITE
          </span>
        </div>
      </div>

      {/* Scrollable Mini Website Viewport */}
      <div ref={miniViewportRef} className="mini-website-scroll" style={{ background: '#FAF8F5', maxHeight: 520, overflowY: 'auto', scrollBehavior: 'smooth' }}>
        {/* 1. Mini Nav */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(66, 43, 28, 0.98)', backdropFilter: 'blur(8px)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }} onClick={() => scrollToMiniSection('home')}>
            <img src="/images/quokka-logo.svg" alt="Mini Quokka" style={{ width: 22, height: 22 }} />
            <span style={{ fontFamily: "'Playfair Display', serif", color: '#FAF8F5', fontSize: 14, fontWeight: 700 }}>Web Quokka</span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { id: 'home', label: 'Home' },
              { id: 'services', label: 'Services' },
              { id: 'work', label: 'Work' },
              { id: 'contact', label: 'Contact' },
            ].map(t => (
              <button key={t.id} onClick={() => scrollToMiniSection(t.id)} style={{ background: 'transparent', border: 'none', color: activeMiniTab === t.id ? '#8B9E7D' : 'rgba(250,248,245,0.7)', fontWeight: 600, fontSize: 11, cursor: 'pointer', padding: '2px 4px' }}>
                {t.label}
              </button>
            ))}
          </div>

          <button onClick={() => scrollToMiniSection('contact')} style={{ background: '#3A5A40', color: '#FAF8F5', border: 'none', padding: '4px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
            Get Quote
          </button>
        </div>

        {/* 2. Mini Hero Section */}
        <div id="mini-home" style={{ background: '#FAF8F5', padding: '28px 24px 24px', borderBottom: '1px solid #EAE5DD' }}>
          <div style={{ display: 'inline-block', background: 'rgba(58,90,64,0.12)', borderRadius: 100, padding: '3px 12px', fontSize: 10, fontWeight: 700, color: '#3A5A40', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            ✨ STUDIO DIGITAL EXPERIENCE
          </div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#422b1c', marginBottom: 8, lineHeight: 1.25 }}>
            Crafting Digital Experiences for Bold Brands.
          </h3>
          <p style={{ fontSize: 12, color: '#6b635c', lineHeight: 1.6, marginBottom: 18, maxWidth: 440 }}>
            High-converting websites and web applications built in 14 days with zero fuss and full studio care.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => scrollToMiniSection('services')} style={{ background: '#422b1c', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              Explore Services →
            </button>
            <button onClick={() => scrollToMiniSection('work')} style={{ background: '#3A5A40', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              View Featured Work
            </button>
          </div>
        </div>

        {/* 3. Mini Services Grid */}
        <div id="mini-services" style={{ padding: '24px 20px', background: '#F4F0EA', borderBottom: '1px solid #E2DED7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#3A5A40', textTransform: 'uppercase', letterSpacing: '0.08em' }}>What We Deliver</span>
              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#422b1c' }}>Studio Solutions</h4>
            </div>
            <span style={{ fontSize: 11, color: '#6b635c' }}>3 Core Offerings</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { icon: '🌐', title: 'Web Design', badge: '$699', desc: 'Custom responsive 5-page site' },
              { icon: '🛒', title: 'E-Commerce', badge: '$999', desc: 'Stripe & catalog storefront' },
              { icon: '⚙️', title: 'Web Apps', badge: '$2,499', desc: 'Custom CRUD & auth apps' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#ffffff', borderRadius: 12, padding: 12, border: '1px solid #E2DED7', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#422b1c' }}>{s.title}</div>
                  <div style={{ fontSize: 9, color: '#6b635c', marginTop: 2, lineHeight: 1.4 }}>{s.desc}</div>
                </div>
                <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: '#3A5A40' }}>{s.badge}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Mini Featured Projects Showcase */}
        <div id="mini-work" style={{ padding: '24px 20px', background: '#FAF8F5', borderBottom: '1px solid #EAE5DD' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#3A5A40', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Portfolio Showcase</span>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#422b1c', marginBottom: 12 }}>Featured Client Sites</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { title: 'Bloom Florist E-Store', tag: 'E-Commerce', rev: '+$40k in 90 days', bg: '#422b1c', text: '#FAF8F5' },
              { title: 'Torres Plumbing Co.', tag: 'Service Site', rev: '3x Lead Conversion', bg: '#3A5A40', text: '#FAF8F5' },
              { title: 'NairFit Studio Booking', tag: 'Web App', rev: '100% Automated', bg: '#FAF8F5', text: '#422b1c', border: true },
            ].map((p, i) => (
              <div key={i} style={{ background: p.bg, color: p.text, borderRadius: 12, padding: '12px 16px', border: p.border ? '1px solid #E2DED7' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{p.title}</div>
                  <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{p.tag}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)' }}>
                  {p.rev}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Mini Process */}
        <div style={{ padding: '24px 20px', background: '#F4F0EA', borderBottom: '1px solid #E2DED7' }}>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#422b1c', marginBottom: 12 }}>Our 4-Step Process</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { num: '01', title: 'Discover', desc: 'Brief & Goals' },
              { num: '02', title: 'Design', desc: 'Studio Mockups' },
              { num: '03', title: 'Build', desc: 'Clean React Code' },
              { num: '04', title: 'Launch', desc: '14-Day Delivery' },
            ].map(st => (
              <div key={st.num} style={{ background: '#ffffff', padding: 10, borderRadius: 10, border: '1px solid #E2DED7' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#3A5A40' }}>{st.num} • {st.title}</div>
                <div style={{ fontSize: 9, color: '#6b635c', marginTop: 2 }}>{st.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Mini Testimonial Quote */}
        <div style={{ padding: '20px', background: '#422b1c', color: '#FAF8F5' }}>
          <div style={{ fontSize: 12, color: '#8B9E7D', marginBottom: 4 }}>★ ★ ★ ★ ★</div>
          <div style={{ fontSize: 11, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 6 }}>
            "Web Quokka built our online store in just 2 weeks. Sales went up 40% in the first month!"
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8B9E7D' }}>— Sarah Mitchell, Owner, Bloom Florist</div>
        </div>

        {/* 7. Mini Interactive Form */}
        <div id="mini-contact" style={{ padding: '24px 20px', background: '#FAF8F5' }}>
          <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#422b1c', marginBottom: 6 }}>Request a Quote</h4>
          <p style={{ fontSize: 11, color: '#6b635c', marginBottom: 12 }}>Test this live mini-form inside the preview window!</p>

          {miniFormSent ? (
            <div style={{ background: 'rgba(58,90,64,0.12)', padding: 14, borderRadius: 10, textAlign: 'center', color: '#3A5A40', fontWeight: 700, fontSize: 12 }}>
              ✓ Mini Enquiry Sent! We'll reply within 24h.
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setMiniFormSent(true) }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={miniFormName} onChange={e => setMiniFormName(e.target.value)} placeholder="Your Name or Business" required className="form-input" style={{ padding: '8px 12px', fontSize: 11, borderRadius: 8 }} />
              <button type="submit" style={{ background: '#3A5A40', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Submit Mini Quote Request →
              </button>
            </form>
          )}
        </div>

        {/* 8. Mini Footer */}
        <div style={{ padding: '14px 20px', background: '#162344', color: 'rgba(250,248,245,0.7)', fontSize: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>© 2026 Web Quokka Studio</span>
          <span>Perth, WA 6000</span>
        </div>
      </div>

      {/* Floating Badge */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, background: '#ffffff', borderRadius: 12, padding: '8px 14px', boxShadow: '0 8px 28px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E2DED7', pointerEvents: 'none' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3A5A40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#422b1c' }}>Live Mini Site</div>
          <div style={{ fontSize: 9, color: '#3A5A40', fontWeight: 600 }}>Scroll inside window ↕</div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── HERO ─────────────────────────── */
function HeroSection() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 80) }, [])

  const stats = [
    ['50+', 'Projects delivered'],
    ['100%', 'Client satisfaction'],
    ['24h', 'Response time'],
  ]

  return (
    <section className="hero-section-pad" style={{ background: 'linear-gradient(160deg, #422b1c 0%, #2e1d13 50%, #162344 100%)', minHeight: '92vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '10%', right: '8%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(58,90,64,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(66,43,28,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="hero-flex">
        <div style={{ maxWidth: 600, flex: '1 1 420px' }}>
          <div className={`fade-up ${visible ? 'visible' : ''}`} style={{ marginBottom: 20 }}>
            <span style={{ display: 'inline-block', background: 'rgba(58,90,64,0.25)', border: '1px solid rgba(58,90,64,0.4)', borderRadius: 100, padding: '6px 18px', fontSize: 12, fontWeight: 700, color: '#8B9E7D', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              WEBSITES FOR EVERY BUSINESS
            </span>
          </div>

          <h1 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(44px, 5.5vw, 68px)', fontWeight: 700, color: '#FAF8F5', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 24 }}>
            Every business deserves a{' '}
            <span style={{ fontStyle: 'italic', color: '#8B9E7D', position: 'relative', display: 'inline-block' }}>
              website
            </span>
            {' '}that works.
          </h1>

          <p className={`fade-up d2 ${visible ? 'visible' : ''}`} style={{ fontSize: 18, color: 'rgba(250,248,245,0.8)', lineHeight: 1.7, marginBottom: 40, maxWidth: 560 }}>
            We build affordable, high-quality websites and apps for small businesses — so you can focus on what you do best. No bloat, no jargon, no surprises.
          </p>

          <div className={`hero-cta fade-up d3 ${visible ? 'visible' : ''}`}>
            <a href="#contact" className="btn-sage" style={{ padding: '14px 30px', fontSize: 15 }}>Start Your Project →</a>
            <a href="#services" className="btn-outline" style={{ color: '#FAF8F5', borderColor: 'rgba(250,248,245,0.4)', padding: '14px 26px', fontSize: 15 }}>View Services</a>
          </div>

          <div className={`hero-stats fade-up d4 ${visible ? 'visible' : ''}`}>
            {stats.map(([num, label]) => (
              <div key={label}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 700, color: '#FAF8F5', lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: 13, color: 'rgba(250,248,245,0.6)', marginTop: 6, fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`fade-up d3 ${visible ? 'visible' : ''}`} style={{ flex: '1 1 440px', maxWidth: 620 }}>
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
    { icon: '🔧', title: 'Website & App Maintenance', desc: 'We keep your digital presence running smoothly — updates, security patches, and performance monitoring.' },
    { icon: '☁️', title: 'Hosting & Backend', desc: "Fast, reliable, and scalable hosting powered by modern cloud infrastructure. We handle it so you don't have to." },
  ]

  return (
    <section id="services" ref={ref} style={{ background: '#FAF8F5', padding: '100px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p className={`fade-up ${visible ? 'visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#3A5A40', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>What We Do</p>
          <h2 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, color: '#422b1c', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Services built for <span style={{ color: '#3A5A40', fontStyle: 'italic' }}>real businesses</span>
          </h2>
          <p className={`fade-up d2 ${visible ? 'visible' : ''}`} style={{ fontSize: 17, color: '#6b635c', marginTop: 16 }}>Everything you need to get online — and stay ahead.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {services.map((s, i) => (
            <div key={s.title} className={`card-lift fade-up ${visible ? 'visible' : ''}`} style={{ transitionDelay: `${0.05 + i * 0.07}s`, background: '#ffffff', borderRadius: 20, padding: 36, position: 'relative', border: '1px solid #E2DED7', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              {s.badge && <span className="pill" style={{ position: 'absolute', top: 24, right: 24 }}>{s.badge}</span>}
              <div style={{ fontSize: 34, marginBottom: 16 }}>{s.icon}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: '#422b1c', marginBottom: 12 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: '#6b635c', lineHeight: 1.7, marginBottom: 24 }}>{s.desc}</p>
              <a href="#contact" style={{ fontSize: 14, fontWeight: 700, color: '#3A5A40', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                Learn more →
              </a>
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
    { icon: '✨', title: 'Modern Studio Design', desc: 'Clean, professional, and conversion-focused. Every site we build is designed to impress and perform.' },
  ]

  return (
    <section id="why-us" style={{ background: '#422b1c', padding: '100px 32px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(58,90,64,0.2), transparent 70%)', pointerEvents: 'none' }} />
      <div ref={ref} style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p className={`fade-up ${visible ? 'visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#8B9E7D', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Why Web Quokka</p>
          <h2 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, color: '#FAF8F5', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Built different. <span style={{ color: '#8B9E7D', fontStyle: 'italic' }}>On purpose.</span>
          </h2>
          <p className={`fade-up d2 ${visible ? 'visible' : ''}`} style={{ fontSize: 17, color: 'rgba(250,248,245,0.7)', marginTop: 16 }}>We obsess over the details so you can focus on running your business.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 24 }}>
          {reasons.map((r, i) => (
            <div key={r.title} className={`card-lift fade-up ${visible ? 'visible' : ''}`} style={{ transitionDelay: `${i * 0.1}s`, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 32 }}>
              <div style={{ fontSize: 34, marginBottom: 16 }}>{r.icon}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: '#FAF8F5', marginBottom: 10 }}>{r.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(250,248,245,0.7)', lineHeight: 1.7 }}>{r.desc}</p>
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
    <section style={{ background: '#3A5A40', padding: '24px 0', overflow: 'hidden' }}>
      <div className="marquee-wrap">
        <div className="marquee-track marquee-ltr">
          {doubled.map((item, i) => (
            <span key={i} style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: '#FAF8F5', display: 'inline-flex', alignItems: 'center', gap: 28 }}>
              {item} <span style={{ fontSize: 12, opacity: 0.6 }}>✦</span>
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
    { num: '02', title: 'Design', desc: 'We craft pixel-perfect mockups tailored to your brand. You get to see and approve everything before coding.' },
    { num: '03', title: 'Build', desc: 'Our team brings the design to life — fast, clean code with performance, SEO, and accessibility baked in.' },
    { num: '04', title: 'Launch', desc: 'We handle deployment, testing, and final checks. Your site goes live on time, every time.' },
    { num: '05', title: 'Maintain', desc: "Post-launch support, updates, and growth features. We're with you for the long haul." },
  ]

  return (
    <section id="process" ref={ref} style={{ background: '#FAF8F5', padding: '100px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p className={`fade-up ${visible ? 'visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#3A5A40', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>How It Works</p>
          <h2 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 50px)', fontWeight: 700, color: '#422b1c', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Simple process, <span style={{ color: '#3A5A40', fontStyle: 'italic' }}>real results</span>
          </h2>
          <p className={`fade-up d2 ${visible ? 'visible' : ''}`} style={{ fontSize: 17, color: '#6b635c', marginTop: 16 }}>Five clear steps from idea to a live, thriving digital presence.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800, margin: '0 auto' }}>
          {steps.map((s, i) => (
            <div key={s.num} className={`card-lift fade-up ${visible ? 'visible' : ''}`} style={{ transitionDelay: `${i * 0.08}s`, display: 'flex', gap: 28, alignItems: 'flex-start', background: '#ffffff', borderRadius: 20, padding: '28px 36px', border: '1px solid #EAE5DD', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: '#3A5A40', lineHeight: 1, flexShrink: 0 }}>{s.num}</div>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: '#422b1c', marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: '#6b635c', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}



/* ─────────────────────────── BLOG (COMMENTED OUT) ───────────────────────────
const blogPosts = [
  {
    emoji: '🔍',
    title: "5 Reasons Your Business Website Isn't Showing Up on Google",
    date: 'Mar 18, 2026',
    readTime: '4 min read',
    desc: "Most small business sites make the same avoidable mistakes. Here's what's holding your rankings back — and how to fix it.",
    content: [
      { type: 'intro', text: "You built the website. You hit publish. You waited. And… nothing. No calls, no form fills, no new customers finding you through search. If this sounds familiar, you're not alone — but you're also not stuck." },
      { type: 'heading', text: '1. You Haven\'t Set Up Google Business Profile' },
      { type: 'body', text: "If you haven't claimed and completed your Google Business Profile — with your address, phone number, opening hours, photos, and category — Google has very little reason to show you in local search results." },
      { type: 'heading', text: '2. Your Website Has No Keywords on the Page' },
      { type: 'body', text: "Every page of your site should clearly state what service you offer and where you're located. \"Affordable plumber in Perth\" is infinitely more searchable than \"We're here to help.\"" },
      { type: 'cta', text: "Web Quokka builds every site with SEO fundamentals baked in from day one. Want a free audit of your current site?" },
    ],
  },
  {
    emoji: '⚡',
    title: 'First Impressions Take 0.05 Seconds — Make Yours Count',
    date: 'Feb 28, 2026',
    readTime: '5 min read',
    desc: "Research shows users form a visual impression in as little as 50 milliseconds. Here's how to make yours count.",
    content: [
      { type: 'intro', text: "Research shows that users form a visual impression of a website in as little as 50 milliseconds — 0.05 seconds. Before reading a word, they decide if you look credible." },
      { type: 'heading', text: 'Visual Hierarchy & Tone Matter' },
      { type: 'body', text: "Colour psychology and high-contrast typography perform heavy lifting. High quality serif headings and grounded sage green tones project immediate quality." },
      { type: 'cta', text: "At Web Quokka, every site we build earns trust in those first 50 milliseconds." },
    ],
  },
  {
    emoji: '💸',
    title: 'How a $1,500 Studio Website Generated $40k in Its First Quarter',
    date: 'Feb 10, 2026',
    readTime: '6 min read',
    desc: "A local florist came to us with zero online presence. Here's what we built, why it worked, and the numbers that followed.",
    content: [
      { type: 'intro', text: "When Bloom Florist approached us, they were taking orders by phone and Instagram DMs. Revenue was being left on the table every week." },
      { type: 'heading', text: 'What We Built' },
      { type: 'body', text: "We built a clean e-commerce site with mobile-first checkout, clear product photography, and smooth payments." },
      { type: 'cta', text: "A well-built website isn't a cost. It's an asset that works 24/7. Let's build yours." },
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(34,24,20,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} className="blog-modal-box">
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f3f4f6', cursor: 'pointer', fontSize: 18, color: '#6b635c' }}>×</button>
        <div style={{ fontSize: 44, marginBottom: 16 }}>{post.emoji}</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: '#6b635c', fontWeight: 500 }}>{post.date}</span>
          <span style={{ fontSize: 13, color: '#6b635c' }}>·</span>
          <span style={{ fontSize: 13, color: '#3A5A40', fontWeight: 700 }}>{post.readTime}</span>
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 'clamp(22px, 3vw, 30px)', color: '#422b1c', lineHeight: 1.3, marginBottom: 28 }}>{post.title}</h2>
        <div>
          {post.content.map((block, i) => {
            if (block.type === 'intro') return <p key={i} style={{ fontSize: 17, color: '#374151', lineHeight: 1.8, marginBottom: 24, fontWeight: 500 }}>{block.text}</p>
            if (block.type === 'heading') return <h3 key={i} style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: '#422b1c', marginTop: 32, marginBottom: 12 }}>{block.text}</h3>
            if (block.type === 'body') return <p key={i} style={{ fontSize: 16, color: '#4b5563', lineHeight: 1.8, marginBottom: 20 }}>{block.text}</p>
            if (block.type === 'cta') return (
              <div key={i} style={{ background: '#FAF8F5', borderRadius: 16, padding: '24px 28px', marginTop: 32, border: '1px solid #E2DED7' }}>
                <p style={{ fontSize: 15, color: '#422b1c', lineHeight: 1.7, marginBottom: 18, fontWeight: 500 }}>{block.text}</p>
                <a href="#contact" onClick={onClose} className="btn-sage">Get in touch →</a>
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
      <section id="blog" ref={ref} style={{ background: '#FAF8F5', padding: '100px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p className={`fade-up ${visible ? 'visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#3A5A40', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Blog</p>
            <h2 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 50px)', fontWeight: 700, color: '#422b1c', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              Insights & Resources
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 24 }}>
            {blogPosts.map((p, i) => (
              <div key={p.title} className={`card-lift fade-up ${visible ? 'visible' : ''}`} onClick={() => setActivePost(p)} style={{ transitionDelay: `${i * 0.1}s`, background: '#ffffff', borderRadius: 20, padding: 32, border: '1px solid #E2DED7', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{p.emoji}</div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#6b635c', fontWeight: 500 }}>{p.date}</span>
                  <span style={{ fontSize: 12, color: '#6b635c' }}>·</span>
                  <span style={{ fontSize: 12, color: '#3A5A40', fontWeight: 700 }}>{p.readTime}</span>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 18, color: '#422b1c', lineHeight: 1.4, marginBottom: 12 }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: '#6b635c', lineHeight: 1.7, marginBottom: 20, flex: 1 }}>{p.desc}</p>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#3A5A40' }}>Read story →</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
─────────────────────────── END BLOG (COMMENTED OUT) ─────────────────────────── */



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
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiBaseUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          business: form.business.trim() || null,
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          service: form.service,
          message: form.message.trim(),
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to send your message. Please try again.')
      }

      setStatus('success')
    } catch (err) {
      console.error('Contact form error:', err)
      setErrorMsg(err?.message || 'Failed to send your message. Please try again.')
      setStatus('error')
    }
  }

  const serviceOptions = ['Web Design', 'E-Commerce', 'Web Application', 'Mobile App', 'Maintenance', 'Hosting & Infrastructure', 'Not sure yet']

  if (status === 'success') {
    return (
      <section id="contact" style={{ background: '#422b1c', padding: '100px 32px' }}>
        <div style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: '#FAF8F5', marginBottom: 16 }}>Message Received!</h2>
          <p style={{ fontSize: 16, color: 'rgba(250,248,245,0.7)', lineHeight: 1.7, marginBottom: 20 }}>Thanks for reaching out to Web Quokka. We will respond within 24 hours.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
            <button className="btn-sage" onClick={() => { setStatus('idle'); setForm({ name: '', business: '', email: '', phone: '', service: '', message: '' }) }}>Send Another Message</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" ref={ref} style={{ background: '#422b1c', padding: '100px 32px' }}>
      <div className="contact-grid">
        <div>
          <p className={`fade-up ${visible ? 'visible' : ''}`} style={{ fontSize: 13, fontWeight: 700, color: '#8B9E7D', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Get In Touch</p>
          <h2 className={`fade-up d1 ${visible ? 'visible' : ''}`} style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 3.5vw, 48px)', fontWeight: 700, color: '#FAF8F5', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 20 }}>
            Let's build something <span style={{ color: '#8B9E7D', fontStyle: 'italic' }}>great together.</span>
          </h2>
          <p className={`fade-up d2 ${visible ? 'visible' : ''}`} style={{ fontSize: 16, color: 'rgba(250,248,245,0.7)', lineHeight: 1.7, marginBottom: 40 }}>
            Tell us about your project or ambitions. We provide transparent advice, clear options, and guidance at every step.
          </p>

          <div className={`fade-up d3 ${visible ? 'visible' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 22, background: 'rgba(58,90,64,0.3)', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✉️</span>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(250,248,245,0.5)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Contact</div>
                <a href="mailto:quokkasupport@gmail.com" style={{ fontSize: 16, fontWeight: 700, color: '#8B9E7D', textDecoration: 'none' }}>quokkasupport@gmail.com</a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 22, background: 'rgba(58,90,64,0.3)', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📞</span>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(250,248,245,0.5)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</div>
                <a href="tel:+610451665643" style={{ fontSize: 16, fontWeight: 700, color: '#FAF8F5', textDecoration: 'none' }}>+61 0451 665 643</a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 22, background: 'rgba(58,90,64,0.3)', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🌐</span>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(250,248,245,0.5)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website</div>
                <a href="https://www.webquokka.com.au" target="_blank" rel="noreferrer" style={{ fontSize: 16, fontWeight: 700, color: '#FAF8F5', textDecoration: 'none' }}>www.webquokka.com.au</a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 22, background: 'rgba(58,90,64,0.3)', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📍</span>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(250,248,245,0.5)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#FAF8F5' }}>Perth, WA, 6000, Australia</div>
              </div>
            </div>
          </div>
        </div>

        <form className={`contact-form-box fade-up d2 ${visible ? 'visible' : ''}`} onSubmit={handleSubmit}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#422b1c', fontWeight: 700, marginBottom: 20 }}>Send an Enquiry</h3>
          <div className="form-2col">
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#422b1c', marginBottom: 6 }}>Your Name *</label>
              <input className="form-input" placeholder="Jane Smith" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#422b1c', marginBottom: 6 }}>Business Name</label>
              <input className="form-input" placeholder="Smith & Co Studio" value={form.business} onChange={e => setForm(f => ({ ...f, business: e.target.value }))} />
            </div>
          </div>
          <div className="form-2col">
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#422b1c', marginBottom: 6 }}>Email *</label>
              <input className="form-input" type="email" placeholder="jane@example.com" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#422b1c', marginBottom: 6 }}>Phone</label>
              <input className="form-input" placeholder="+61 0451 665 643" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#422b1c', marginBottom: 6 }}>Service Needed *</label>
            <select className="form-input" required value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}>
              <option value="">Select a service…</option>
              {serviceOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#422b1c', marginBottom: 6 }}>Tell us about your project *</label>
            <textarea className="form-input" rows={4} placeholder="Briefly describe what you need…" required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 16 }}>{errorMsg}</p>}
          <button type="submit" className="btn-sage" style={{ width: '100%', justifyContent: 'center' }} disabled={status === 'loading'}>
            {status === 'loading' ? 'Sending…' : 'Send Message →'}
          </button>
          <p style={{ fontSize: 12, color: '#6b635c', textAlign: 'center', marginTop: 14 }}>No jargon. No obligation. We will respond within 24 hours.</p>
        </form>
      </div>
    </section>
  )
}

/* ─────────────────────────── FOOTER ─────────────────────────── */
function Footer() {
  const year = new Date().getFullYear()
  const links = [
    ['Services', '#services'],
    ['Why Us', '#why-us'],
    ['Process', '#process'],
    ['Testimonials', '#testimonials'],
    // ['Blog', '#blog'],
    ['Pricing', '#pricing'],
    ['Contact', '#contact']
  ]

  return (
    <footer style={{ background: '#162344', color: '#FAF8F5', padding: '64px 32px 32px', borderTop: '3px solid #3A5A40' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40, marginBottom: 48 }}>
          <div style={{ maxWidth: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <img src="/images/quokka-logo.svg" alt="Web Quokka" style={{ height: 34, width: 34 }} />
              <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: '#FAF8F5' }}>Web Quokka</span>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(250,248,245,0.7)', lineHeight: 1.7 }}>
              Affordable, high-quality websites and apps built with studio care for Australian small businesses.
            </p>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8B9E7D', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Navigation</div>
            {links.map(([label, href]) => (
              <a key={label} href={href} style={{ display: 'block', marginBottom: 10, fontSize: 14, color: 'rgba(250,248,245,0.7)', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => (e.target.style.color = '#8B9E7D')}
                onMouseLeave={e => (e.target.style.color = 'rgba(250,248,245,0.7)')}
              >{label}</a>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#8B9E7D', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Contact Info</div>
            <p style={{ fontSize: 14, color: 'rgba(250,248,245,0.7)', lineHeight: 1.8 }}>
              Email: quokkasupport@gmail.com<br />
              Phone: +61 0451 665 643<br />
              Location: Perth, WA, 6000<br />
              Australia
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'rgba(250,248,245,0.5)' }}>© {year} Web Quokka. All rights reserved.</p>
          <p style={{ fontSize: 13, color: 'rgba(250,248,245,0.5)' }}>Built with ❤️ in Perth, Western Australia</p>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────── MAIN PAGE ─────────────────────────── */
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
      {/* <BlogSection /> */}
      <PricingSection />
      <ContactSection />
      <Footer />
    </>
  )
}
