import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import PricingSection from '@/components/sections/pricing-section'
import TestimonialsSection from '@/components/sections/testimonials-section'
import ConstellationGrid from '@/components/sections/constellation-grid'
import {
  Globe, ShoppingCart, Settings2, Smartphone, Wrench, Cloud,
  Sparkles, Handshake, RefreshCcw, Wallet, Mail, Phone, MapPin,
  Menu, X, ArrowRight, ArrowUpRight, Check, ChevronDown, HeartHandshake,
  Rocket, ShieldCheck, Users,
} from 'lucide-react'

/* ─────────────────────────── SHARED ─────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        obs.disconnect()
      }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return [ref, visible]
}

function reveal(visible, delay = '') {
  return `reveal ${delay} ${visible ? 'in' : ''}`
}

const btn = {
  sage: 'inline-flex items-center justify-center gap-2 rounded-full bg-brand-sage px-7 py-3.5 text-[15px] font-bold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2d4632] hover:shadow-lift active:translate-y-0',
  brown: 'inline-flex items-center justify-center gap-2 rounded-full bg-brand-brown px-7 py-3.5 text-[15px] font-bold text-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#312015] hover:shadow-lift active:translate-y-0',
  outlineLight: 'inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-brand-brown',
  outlineDark: 'inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand-brown px-6 py-3.5 text-[15px] font-semibold text-brand-brown transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-brown hover:text-white',
}

const NAV_LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Why Us', href: '#why-us' },
  { label: 'Process', href: '#process' },
  { label: 'About', href: '#about' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
]

/* ─────────────────────────── NAVBAR ─────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  function goTo(e, href) {
    e.preventDefault()
    setMenuOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? 'border-white/10 bg-brand-brown/95 shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-md'
            : 'border-transparent bg-brand-brown/90 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8">
          <a
            href="#top"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="flex items-center gap-2.5"
          >
            <img src="/images/quokka-logo.svg" alt="" aria-hidden="true" className="h-9 w-9 sm:h-[38px] sm:w-[38px]" />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-lg font-bold tracking-tight text-brand-cream sm:text-[22px]">Web Quokka</span>
              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-brand-sageLight">Studio Design</span>
            </span>
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => goTo(e, l.href)}
                className="group relative text-sm font-semibold text-brand-cream/85 transition-colors hover:text-brand-cream"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-brand-sageLight transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          <a href="#contact" onClick={(e) => goTo(e, '#contact')} className={`${btn.sage} hidden lg:inline-flex`}>
            Get a Free Quote <ArrowUpRight size={16} aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-full text-brand-cream transition-colors hover:bg-white/10 lg:hidden"
          >
            {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      <div
        className={`fixed inset-0 z-45 bg-brand-brown transition-opacity duration-300 lg:hidden ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="flex h-full flex-col justify-center gap-1 px-8 pb-safe pt-24">
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => goTo(e, l.href)}
              className="border-b border-white/10 py-4 font-serif text-2xl font-semibold text-brand-cream transition-transform duration-300"
              style={{ transitionDelay: menuOpen ? `${i * 40}ms` : '0ms', transform: menuOpen ? 'translateX(0)' : 'translateX(12px)' }}
            >
              {l.label}
            </a>
          ))}
          <a href="#contact" onClick={(e) => goTo(e, '#contact')} className={`${btn.sage} mt-8 w-full`}>
            Get a Free Quote <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────── HERO MOCKUP (TABBED, NO NESTED SCROLL) ─────────────────────────── */
const MOCKUP_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
]

function WebsiteMockup() {
  const [tab, setTab] = useState('home')
  const [fade, setFade] = useState(true)
  const [miniSent, setMiniSent] = useState(false)

  function switchTab(next) {
    if (next === tab) return
    setFade(false)
    window.setTimeout(() => { setTab(next); setFade(true) }, 150)
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-brand-brown shadow-[0_32px_80px_rgba(46,29,19,0.45),0_0_0_1px_rgba(255,255,255,0.12)]">
      {/* Browser chrome */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#312015] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="hidden rounded-md bg-white/10 px-3 py-1 text-[11px] text-white/60 sm:block">
            webquokka.com.au
          </div>
        </div>
        <span className="rounded-full bg-brand-sage px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
          LIVE PREVIEW
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-white/10 bg-brand-brown px-3 py-2" role="tablist" aria-label="Mini site preview">
        {MOCKUP_TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => switchTab(t.id)}
            className={`min-h-[36px] flex-1 rounded-lg px-2 text-xs font-bold transition-colors ${
              tab === t.id ? 'bg-brand-sage text-white' : 'text-brand-cream/60 hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel (single view, no internal scroll region) */}
      <div className={`min-h-[360px] bg-brand-cream transition-opacity duration-200 sm:min-h-[420px] ${fade ? 'opacity-100' : 'opacity-0'}`}>
        {tab === 'home' && (
          <div className="p-6">
            <span className="mb-3 inline-block rounded-full bg-brand-sage/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-sage">
              Studio Digital Experience
            </span>
            <h3 className="mb-3 font-serif text-xl font-bold leading-snug text-brand-ink">
              Crafting digital experiences for bold brands.
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-brand-muted">
              High-converting websites and web apps built in 14 days with zero fuss and full studio care.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button onClick={() => switchTab('services')} className="rounded-full bg-brand-brown px-4 py-2.5 text-xs font-bold text-white">
                Explore Services
              </button>
              <button onClick={() => switchTab('work')} className="rounded-full bg-brand-sage px-4 py-2.5 text-xs font-bold text-white">
                View Work
              </button>
            </div>
          </div>
        )}

        {tab === 'services' && (
          <div className="p-6">
            <h4 className="mb-4 font-serif text-lg font-bold text-brand-ink">Studio Solutions</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: Globe, title: 'Web Design', badge: '$699' },
                { icon: ShoppingCart, title: 'E-Commerce', badge: '$999' },
                { icon: Settings2, title: 'Web Apps', badge: '$2,499' },
              ].map((s) => (
                <div key={s.title} className="rounded-xl border border-brand-border bg-white p-3.5 shadow-soft">
                  <s.icon size={20} className="mb-2 text-brand-sage" aria-hidden="true" />
                  <div className="text-xs font-bold text-brand-ink">{s.title}</div>
                  <div className="mt-1 text-[11px] font-bold text-brand-sage">{s.badge}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'work' && (
          <div className="p-6">
            <h4 className="mb-4 font-serif text-lg font-bold text-brand-ink">Featured Client Sites</h4>
            <div className="flex flex-col gap-2.5">
              {[
                { title: 'Bloom Florist E-Store', tag: 'E-Commerce', rev: '+$40k in 90 days', dark: true },
                { title: 'Torres Plumbing Co.', tag: 'Service Site', rev: '3x Lead Conversion', dark: true },
                { title: 'NairFit Studio Booking', tag: 'Web App', rev: '100% Automated', dark: false },
              ].map((p) => (
                <div
                  key={p.title}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                    p.dark ? 'bg-brand-brown text-white' : 'border border-brand-border bg-white text-brand-ink'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{p.title}</div>
                    <div className="mt-0.5 text-[10px] opacity-75">{p.tag}</div>
                  </div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">{p.rev}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'contact' && (
          <div className="p-6">
            <h4 className="mb-1 font-serif text-lg font-bold text-brand-ink">Request a Quote</h4>
            <p className="mb-4 text-xs text-brand-muted">Try this live mini-form.</p>
            {miniSent ? (
              <div className="rounded-xl bg-brand-sage/10 p-4 text-center text-xs font-bold text-brand-sage">
                Mini enquiry sent! We'll reply within 24h.
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); setMiniSent(true) }}
                className="flex flex-col gap-2.5"
              >
                <input
                  required
                  placeholder="Your name or business"
                  aria-label="Your name or business"
                  className="rounded-lg border border-brand-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-sage focus:ring-2 focus:ring-brand-sage/20"
                />
                <button type="submit" className="rounded-lg bg-brand-sage px-3.5 py-2.5 text-sm font-bold text-white">
                  Submit Mini Request
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────── HERO ─────────────────────────── */
function HeroSection() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t) }, [])

  const stats = [
    ['50+', 'Projects delivered'],
    ['100%', 'Client satisfaction'],
    ['24h', 'Response time'],
  ]

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-br from-brand-brown via-[#2e1d13] to-brand-charcoal pb-14 pt-28 sm:pb-20 sm:pt-32 lg:pt-36"
    >
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <ConstellationGrid />
      </div>
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-brand-sage/25 blur-3xl sm:h-[420px] sm:w-[420px]" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-brand-brown/40 blur-3xl sm:h-96 sm:w-96" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-14 lg:px-8">
        <div className="max-w-xl">
          <div className={reveal(visible)}>
            <span className="inline-block rounded-full border border-brand-sage/40 bg-brand-sage/20 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-sageLight sm:text-xs">
              Websites for every business
            </span>
          </div>

          <h1 className={`${reveal(visible, 'reveal-d1')} mt-5 font-serif text-[clamp(2.25rem,8vw,4.25rem)] font-bold leading-[1.08] tracking-tight text-brand-cream`}>
            Every business deserves a{' '}
            <span className="italic text-brand-sageLight">website</span> that works.
          </h1>

          <p className={`${reveal(visible, 'reveal-d2')} mt-6 text-base leading-relaxed text-brand-cream/80 sm:text-lg`}>
            We build affordable, high-quality websites and apps for small businesses — so you can focus on what you do best. No bloat, no jargon, no surprises.
          </p>

          <div className={`${reveal(visible, 'reveal-d3')} mt-9 flex flex-col gap-3.5 sm:flex-row`}>
            <a href="#contact" className={`${btn.sage} w-full sm:w-auto`}>
              Start Your Project <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a href="#services" className={`${btn.outlineLight} w-full sm:w-auto`}>
              View Services
            </a>
          </div>

          <div className={`${reveal(visible, 'reveal-d4')} mt-11 grid grid-cols-3 gap-4 sm:flex sm:gap-12`}>
            {stats.map(([num, label]) => (
              <div key={label}>
                <div className="font-serif text-[28px] font-bold leading-none text-brand-cream sm:text-[34px]">{num}</div>
                <div className="mt-1.5 text-[12px] font-medium leading-snug text-brand-cream/60 sm:whitespace-nowrap sm:text-[13px]">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${reveal(visible, 'reveal-d3')} w-full lg:max-w-[560px]`}>
          <WebsiteMockup />
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
    <section className="overflow-hidden bg-brand-sage py-5" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="mx-5 inline-flex shrink-0 items-center gap-2.5 font-serif text-base font-bold text-brand-cream sm:text-lg">
            {item} <span className="text-xs opacity-60">✦</span>
          </span>
        ))}
      </div>
    </section>
  )
}

/* ─────────────────────────── SERVICES (BENTO) ─────────────────────────── */
const SERVICES = [
  { icon: Globe, title: 'Website Design & Development', desc: 'Beautiful, fast, and SEO-friendly websites tailored to your brand. From landing pages to complex multi-page sites.', badge: 'Most Popular', wide: true },
  { icon: ShoppingCart, title: 'E-Commerce Development', desc: 'Sell online with confidence. We build stores that are easy to manage and optimised for conversions.' },
  { icon: Settings2, title: 'Web Application Development', desc: 'Custom web apps built to solve real business problems. Scalable, secure, and user-friendly.' },
  { icon: Smartphone, title: 'Mobile App Development', desc: 'Cross-platform mobile apps that feel native. Built with modern tools for iOS and Android.' },
  { icon: Wrench, title: 'Website & App Maintenance', desc: 'We keep your digital presence running smoothly — updates, security patches, and performance monitoring.' },
  { icon: Cloud, title: 'Hosting & Backend', desc: "Fast, reliable, and scalable hosting powered by modern cloud infrastructure. We handle it so you don't have to." },
]

function ServicesSection() {
  const [ref, visible] = useReveal()

  return (
    <section id="services" ref={ref} className="bg-brand-cream px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className={`${reveal(visible)} text-xs font-bold uppercase tracking-[0.14em] text-brand-sage`}>What We Do</p>
          <h2 className={`${reveal(visible, 'reveal-d1')} mt-3 font-serif text-[clamp(1.9rem,5vw,3rem)] font-bold leading-tight tracking-tight text-brand-ink`}>
            Services built for <span className="italic text-brand-sage">real businesses</span>
          </h2>
          <p className={`${reveal(visible, 'reveal-d2')} mt-4 text-base text-brand-muted sm:text-lg`}>Everything you need to get online — and stay ahead.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <div
              key={s.title}
              className={`${reveal(visible)} group relative rounded-2xl border border-brand-border bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift ${s.wide ? 'lg:col-span-2' : ''}`}
              style={{ transitionDelay: `${0.05 + i * 0.06}s` }}
            >
              {s.badge && (
                <span className="absolute right-6 top-6 rounded-full bg-brand-sage px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  {s.badge}
                </span>
              )}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-sage/10 text-brand-sage">
                <s.icon size={24} aria-hidden="true" />
              </div>
              <h3 className="mb-2.5 font-serif text-xl font-bold text-brand-ink">{s.title}</h3>
              <p className="mb-5 text-[15px] leading-relaxed text-brand-muted">{s.desc}</p>
              <a href="#contact" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-sage">
                Learn more <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── WHY US ─────────────────────────── */
const REASONS = [
  { icon: Wallet, title: 'Affordable Pricing', desc: 'Premium quality without the agency price tag. Transparent quotes, no hidden fees — ever.' },
  { icon: RefreshCcw, title: 'Simple Process', desc: 'We cut through the complexity. Our 5-step process takes you from idea to launch without the stress.' },
  { icon: Handshake, title: 'Ongoing Support', desc: "We're with you for the long haul. Post-launch support, updates, and growth features whenever you need them." },
  { icon: Sparkles, title: 'Modern Studio Design', desc: 'Clean, professional, and conversion-focused. Every site we build is designed to impress and perform.' },
]

function WhyUsSection() {
  const [ref, visible] = useReveal()

  return (
    <section id="why-us" className="relative overflow-hidden bg-brand-charcoal px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-sage/15 blur-3xl" />
      <div ref={ref} className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className={`${reveal(visible)} text-xs font-bold uppercase tracking-[0.14em] text-brand-sageLight`}>Why Web Quokka</p>
          <h2 className={`${reveal(visible, 'reveal-d1')} mt-3 font-serif text-[clamp(1.9rem,5vw,3rem)] font-bold leading-tight tracking-tight text-brand-cream`}>
            Built different. <span className="italic text-brand-sageLight">On purpose.</span>
          </h2>
          <p className={`${reveal(visible, 'reveal-d2')} mt-4 text-base text-brand-cream/70 sm:text-lg`}>We obsess over the details so you can focus on running your business.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r, i) => (
            <div
              key={r.title}
              className={`${reveal(visible)} rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20`}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-sage/25 text-brand-sageLight">
                <r.icon size={22} aria-hidden="true" />
              </div>
              <h3 className="mb-2 font-serif text-lg font-bold text-brand-cream">{r.title}</h3>
              <p className="text-sm leading-relaxed text-brand-cream/70">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── PROCESS (TIMELINE) ─────────────────────────── */
const STEPS = [
  { num: '01', title: 'Discover', desc: 'We learn everything about your business, goals, and audience through a detailed brief and discovery call.' },
  { num: '02', title: 'Design', desc: 'We craft pixel-perfect mockups tailored to your brand. You get to see and approve everything before coding.' },
  { num: '03', title: 'Build', desc: 'Our team brings the design to life — fast, clean code with performance, SEO, and accessibility baked in.' },
  { num: '04', title: 'Launch', desc: 'We handle deployment, testing, and final checks. Your site goes live on time, every time.' },
  { num: '05', title: 'Maintain', desc: "Post-launch support, updates, and growth features. We're with you for the long haul." },
]

function AboutSection() {
  const [ref, visible] = useReveal()
  const stats = [
    { value: '50+', label: 'projects delivered' },
    { value: '100%', label: 'client focus' },
    { value: '5+', label: 'years experience' },
  ]

  return (
    <section id="about" ref={ref} className="bg-brand-cream2 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20">
        <div>
          <p className={`${reveal(visible)} text-xs font-bold uppercase tracking-[0.14em] text-brand-sage`}>A little about us</p>
          <h2 className={`${reveal(visible, 'reveal-d1')} mt-3 font-serif text-[clamp(1.9rem,5vw,3rem)] font-bold leading-tight text-brand-ink`}>
            Small team. <span className="italic text-brand-sage">Big care.</span>
          </h2>
          <p className={`${reveal(visible, 'reveal-d2')} mt-5 text-base leading-relaxed text-brand-muted sm:text-lg`}>
            Web Quokka is a Perth-based web development studio helping Australian businesses turn good ideas into clear, useful digital experiences.
          </p>
          <p className={`${reveal(visible, 'reveal-d3')} mt-4 text-base leading-relaxed text-brand-muted`}>
            We chose the quokka because it is local, curious, and known for making people smile. That is the feeling we bring to every project: capable work, friendly communication, and no unnecessary fuss.
          </p>
          <div className={`${reveal(visible, 'reveal-d4')} mt-8 grid grid-cols-3 gap-4 border-t border-brand-border pt-6`}>
            {stats.map((stat) => <div key={stat.label}><div className="font-serif text-3xl font-bold text-brand-ink">{stat.value}</div><div className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-muted">{stat.label}</div></div>)}
          </div>
        </div>

        <div className={`${reveal(visible, 'reveal-d2')} grid grid-cols-2 gap-4`}>
          {[
            { icon: HeartHandshake, title: 'Friendly by default', text: 'Clear updates, honest advice, and a human on the other end.' },
            { icon: Rocket, title: 'Built to move', text: 'Practical systems that help you launch, learn, and grow.' },
            { icon: ShieldCheck, title: 'Made to last', text: 'Accessible, maintainable work your business can own.' },
            { icon: Users, title: 'In your corner', text: 'A long-term partner for updates, support, and improvements.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-brand-border bg-white p-5 shadow-soft">
              <Icon size={24} className="mb-4 text-brand-sage" aria-hidden="true" />
              <h3 className="font-serif text-lg font-bold text-brand-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const FAQS = [
  ['How long does a website take?', 'Most starter websites launch in 2–3 weeks. Larger stores and applications take longer, and we will give you a clear timeline before work begins.'],
  ['How much does it cost?', 'Every project is different, but our packages start from $699 AUD. We provide a clear quote before you commit.'],
  ['Do I own the code?', 'Yes. Once the project is paid for, you own the website code and content we create for you.'],
  ['Do you provide hosting?', 'Yes. We can set up hosting, domains, SSL, backups, and analytics, or work with your existing provider.'],
  ["What's included in maintenance?", 'Maintenance can include updates, security checks, backups, content changes, performance checks, and ongoing improvements.'],
  ['Can you work with my existing website?', 'Absolutely. We can improve, rebuild, or maintain an existing site without starting from scratch unnecessarily.'],
  ['Do you work with businesses outside Perth?', 'Yes. We are based in Perth and work with businesses across Australia through video calls and clear async updates.'],
]

function FaqSection() {
  const [open, setOpen] = useState(null)
  return (
    <section id="faq" className="bg-brand-cream px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-sage">Questions, answered</p>
          <h2 className="mt-3 font-serif text-[clamp(1.9rem,5vw,3rem)] font-bold leading-tight text-brand-ink">Good to know.</h2>
        </div>
        <div className="divide-y divide-brand-border rounded-2xl border border-brand-border bg-white px-6 shadow-soft">
          {FAQS.map(([question, answer], index) => (
            <div key={question}>
              <button type="button" className="flex w-full items-center justify-between gap-4 py-5 text-left font-serif text-lg font-bold text-brand-ink" aria-expanded={open === index} onClick={() => setOpen(open === index ? null : index)}>
                {question}<ChevronDown size={20} className={`shrink-0 text-brand-sage transition-transform ${open === index ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              <div className={`grid transition-[grid-template-rows,opacity] duration-300 ${open === index ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <p className="min-h-0 overflow-hidden text-sm leading-relaxed text-brand-muted">{answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProcessSection() {
  const [ref, visible] = useReveal()

  return (
    <section id="process" ref={ref} className="bg-brand-cream px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className={`${reveal(visible)} text-xs font-bold uppercase tracking-[0.14em] text-brand-sage`}>How It Works</p>
          <h2 className={`${reveal(visible, 'reveal-d1')} mt-3 font-serif text-[clamp(1.9rem,5vw,2.9rem)] font-bold leading-tight tracking-tight text-brand-ink`}>
            Simple process, <span className="italic text-brand-sage">real results</span>
          </h2>
          <p className={`${reveal(visible, 'reveal-d2')} mt-4 text-base text-brand-muted sm:text-lg`}>Five clear steps from idea to a live, thriving digital presence.</p>
        </div>

        <div className="relative flex flex-col gap-5">
          <div aria-hidden="true" className="absolute bottom-6 left-[27px] top-6 hidden w-px bg-brand-border sm:block" />
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              className={`${reveal(visible)} relative flex gap-5 rounded-2xl border border-brand-border bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 sm:gap-7 sm:p-7`}
              style={{ transitionDelay: `${i * 0.07}s` }}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-sage/10 font-serif text-xl font-bold text-brand-sage">
                {s.num}
              </div>
              <div>
                <h3 className="mb-1.5 font-serif text-lg font-bold text-brand-ink sm:text-xl">{s.title}</h3>
                <p className="text-[15px] leading-relaxed text-brand-muted">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── CONTACT ─────────────────────────── */
const SERVICE_OPTIONS = ['Web Design', 'E-Commerce', 'Web Application', 'Mobile App', 'Maintenance', 'Hosting & Infrastructure', 'Not sure yet']

function ContactSection() {
  const [ref, visible] = useReveal()
  const [form, setForm] = useState({ name: '', business: '', email: '', phone: '', service: '', budget: '', message: '' })
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.from('enquiries').insert([{
      name: form.name.trim(),
      business: form.business.trim() || null,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
      service: form.service,
      budget: form.budget || null,
      message: form.message.trim(),
    }])

    if (error) {
      console.error('Contact form error:', error)
      setErrorMsg(error.message || 'Failed to send your message. Please try again.')
      setStatus('error')
      return
    }

    setStatus('success')
  }

  const inputClass = 'w-full rounded-xl border border-brand-border bg-white px-4 py-3.5 text-[15px] text-brand-ink outline-none transition-all placeholder:text-brand-muted/70 focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/15'
  const labelClass = 'mb-1.5 block text-sm font-bold text-brand-ink'

  if (status === 'success') {
    return (
      <section id="contact" className="bg-brand-brown px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-sage/20 text-brand-sageLight">
            <Check size={32} aria-hidden="true" />
          </div>
          <h2 className="mb-4 font-serif text-3xl font-bold text-brand-cream sm:text-4xl">Message Received!</h2>
          <p className="mb-8 text-base leading-relaxed text-brand-cream/70">Thanks for reaching out to Web Quokka. We will respond within 24 hours.</p>
          <button
            className={btn.sage}
            onClick={() => { setStatus('idle'); setForm({ name: '', business: '', email: '', phone: '', service: '', budget: '', message: '' }) }}
          >
            Send Another Message
          </button>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" ref={ref} className="bg-brand-brown px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-start lg:gap-16">
        <div>
          <p className={`${reveal(visible)} text-xs font-bold uppercase tracking-[0.14em] text-brand-sageLight`}>Get In Touch</p>
          <h2 className={`${reveal(visible, 'reveal-d1')} mt-3 font-serif text-[clamp(1.9rem,4.5vw,2.9rem)] font-bold leading-tight tracking-tight text-brand-cream`}>
            Let's build something <span className="italic text-brand-sageLight">great together.</span>
          </h2>
          <p className={`${reveal(visible, 'reveal-d2')} mt-5 text-base leading-relaxed text-brand-cream/70`}>
            Tell us about your project or ambitions. We provide transparent advice, clear options, and guidance at every step.
          </p>

          <div className={`${reveal(visible, 'reveal-d3')} mt-9 flex flex-col gap-5`}>
            {[
              { icon: Mail, label: 'Email Contact', value: 'quokksupport@gmail.com', href: 'mailto:quokksupport@gmail.com' },
              { icon: Phone, label: 'Phone', value: '0414 093 339', href: 'tel:+61414093339' },
              { icon: MapPin, label: 'Location', value: 'Perth, Western Australia' },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-sage/25 text-brand-sageLight">
                  <c.icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-cream/50">{c.label}</div>
                  {c.href ? (
                    <a href={c.href} className="text-[15px] font-bold text-brand-cream hover:text-brand-sageLight">{c.value}</a>
                  ) : (
                    <div className="text-[15px] font-semibold text-brand-cream">{c.value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className={`${reveal(visible, 'reveal-d2')} rounded-3xl bg-white p-6 shadow-lift sm:p-9`}>
          <h3 className="mb-5 font-serif text-xl font-bold text-brand-ink sm:text-2xl">Send an Enquiry</h3>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="cf-name">Your Name *</label>
              <input id="cf-name" required autoComplete="name" placeholder="Jane Smith" className={inputClass}
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass} htmlFor="cf-business">Business Name</label>
              <input id="cf-business" autoComplete="organization" placeholder="Smith & Co Studio" className={inputClass}
                value={form.business} onChange={(e) => setForm((f) => ({ ...f, business: e.target.value }))} />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="cf-email">Email *</label>
              <input id="cf-email" type="email" required autoComplete="email" placeholder="jane@example.com" className={inputClass}
                value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass} htmlFor="cf-phone">Phone</label>
              <input id="cf-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0414 093 339" className={inputClass}
                value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          <div className="mb-4">
            <label className={labelClass} htmlFor="cf-service">Service Needed *</label>
            <div className="relative">
              <select id="cf-service" required className={`${inputClass} appearance-none pr-10`}
                value={form.service} onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}>
                <option value="">Select a service…</option>
                {SERVICE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={18} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-brown" />
            </div>
          </div>

          <div className="mb-4">
            <label className={labelClass} htmlFor="cf-budget">Estimated Budget</label>
            <div className="relative">
              <select id="cf-budget" className={`${inputClass} appearance-none pr-10`} value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}>
                <option value="">Select a budget range</option>
                <option value="Under $1,000">Under $1,000</option>
                <option value="$1,000–$2,500">$1,000–$2,500</option>
                <option value="$2,500–$5,000">$2,500–$5,000</option>
                <option value="$5,000+">$5,000+</option>
                <option value="Not sure yet">Not sure yet</option>
              </select>
              <ChevronDown size={18} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-brown" />
            </div>
          </div>

          <div className="mb-6">
            <label className={labelClass} htmlFor="cf-message">Tell us about your project *</label>
            <textarea id="cf-message" required rows={4} placeholder="Briefly describe what you need…" className={`${inputClass} resize-y`}
              value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
          </div>

          {status === 'error' && (
            <p role="alert" className="mb-4 text-sm font-medium text-red-600">{errorMsg}</p>
          )}

          <button type="submit" disabled={status === 'loading'} className={`${btn.sage} w-full disabled:cursor-not-allowed disabled:opacity-60`}>
            {status === 'loading' ? 'Sending…' : 'Send Message'}
            {status !== 'loading' && <ArrowRight size={16} aria-hidden="true" />}
          </button>
          <p className="mt-3.5 text-center text-xs text-brand-muted">No jargon. No obligation. We will respond within 24 hours.</p>
        </form>
      </div>
    </section>
  )
}

/* ─────────────────────────── FOOTER ─────────────────────────── */
function Footer() {
  const year = new Date().getFullYear()
  const links = [
    ['Services', '#services'], ['Why Us', '#why-us'], ['Process', '#process'],
    ['Testimonials', '#testimonials'], ['Pricing', '#pricing'], ['Contact', '#contact'],
  ]

  return (
    <footer className="border-t-[3px] border-brand-sage bg-brand-charcoal px-4 pb-24 pt-14 text-brand-cream sm:px-6 sm:pb-12 sm:pt-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap justify-between gap-10">
          <div className="max-w-xs">
            <div className="mb-4 flex items-center gap-2.5">
              <img src="/images/quokka-logo.svg" alt="" aria-hidden="true" className="h-8 w-8" />
              <span className="font-serif text-lg font-bold text-brand-cream">Web Quokka</span>
            </div>
            <p className="text-sm leading-relaxed text-brand-cream/70">
              Affordable, high-quality websites and apps built with studio care for Australian small businesses.
            </p>
          </div>

          <div>
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-brand-sageLight">Navigation</div>
            <ul className="space-y-2.5">
              {links.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="text-sm font-medium text-brand-cream/70 transition-colors hover:text-brand-sageLight">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-brand-sageLight">Contact Info</div>
            <p className="text-sm leading-[1.9] text-brand-cream/70">
              Email: quokksupport@gmail.com<br />
              Phone: 0414 093 339<br />
              Location: Perth, Western Australia
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-white/10 pt-6">
          <p className="text-[13px] text-brand-cream/50">© {year} Web Quokka. All rights reserved.</p>
          <p className="text-[13px] text-brand-cream/50">Built with care in Perth, Western Australia</p>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────── MOBILE STICKY CTA BAR ─────────────────────────── */
function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-brand-border bg-white/95 px-4 pb-safe pt-3 shadow-[0_-8px_24px_rgba(46,29,19,0.12)] backdrop-blur-md sm:hidden">
      <a href="tel:+61414093339" className={`${btn.outlineDark} flex-1 !px-4 !py-3 text-sm`}>
        <Phone size={16} aria-hidden="true" /> Call
      </a>
      <a href="#contact" className={`${btn.sage} flex-1 !px-4 !py-3 text-sm`}>
        Get a Quote <ArrowRight size={16} aria-hidden="true" />
      </a>
    </div>
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
      <AboutSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <ContactSection />
      <Footer />
      <MobileCtaBar />
    </>
  )
}
