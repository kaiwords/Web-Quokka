export const SITE = {
  name: 'WebQuokka',
  tagline: 'From MVP to Launch — and Beyond',
  location: 'Perth, Western Australia',
  // Short form for tight spots (hero eyebrow, chips) where the full state name wraps.
  locationShort: 'Perth, WA',
  email: 'quokkasupport@gmail.com',
  phone: '0414 093 339',
  phoneHref: 'tel:+61414093339',
  emailHref: 'mailto:quokkasupport@gmail.com',
}

// The management app (apps/management) is deployed to its own origin — the
// client portal and the staff CRM both live there. The marketing site only
// ever links across; it never holds a session or posts credentials itself, so
// auth cookies stay same-origin to that app.
//
// Set VITE_MANAGEMENT_URL in .env (see .env.example). The localhost fallback
// is what `npm run dev` at the repo root starts the Next app on.
const MANAGEMENT_URL = (import.meta.env.VITE_MANAGEMENT_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
)

export const PORTAL = {
  clientLogin: `${MANAGEMENT_URL}/portal/login`,
  clientSignup: `${MANAGEMENT_URL}/portal/signup`,
  // Staff CRM. Deliberately not advertised in the main nav — it is an internal
  // tool, and there is no public sign-up for it.
  staffLogin: `${MANAGEMENT_URL}/login`,
}

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Process', to: '/process' },
  { label: 'About', to: '/about' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/contact' },
]

export const SERVICES = [
  {
    slug: 'mvp-development',
    icon: 'Rocket',
    title: 'MVP Development',
    short: 'Turn your idea into a working product fast, without cutting corners on quality.',
    description:
      'We help founders validate ideas quickly with a lean, well-built minimum viable product — ready to put in front of real users and investors.',
    features: [
      'Rapid discovery & scoping',
      'Core feature-first build',
      'Scalable foundation for growth',
      'Launch-ready in weeks, not months',
    ],
  },
  {
    slug: 'custom-websites',
    icon: 'Layout',
    title: 'Custom Business Websites',
    short: 'A fast, on-brand website that tells your story and converts visitors into customers.',
    description:
      'Hand-crafted marketing and business websites built around your brand, your customers, and your goals — no generic templates.',
    features: [
      'Bespoke design, not a template',
      'Mobile-first & fast loading',
      'SEO-friendly structure',
      'Easy content updates',
    ],
  },
  {
    slug: 'ecommerce-websites',
    icon: 'ShoppingCart',
    title: 'E-commerce Websites',
    short: 'Sell online with a smooth, secure storefront built to convert browsers into buyers.',
    description:
      'Custom online stores with secure checkout, inventory-friendly structure, and a shopping experience your customers will enjoy.',
    features: [
      'Secure checkout & payments',
      'Product catalogue & search',
      'Mobile-optimised cart flow',
      'Analytics-ready from day one',
    ],
  },
  {
    slug: 'app-development',
    icon: 'Smartphone',
    title: 'Web & Mobile App Development',
    short: 'Custom web and mobile applications built to handle real business complexity.',
    description:
      'From internal tools to customer-facing apps, we design and build applications that are reliable, intuitive, and built to scale.',
    features: [
      'Web & cross-platform mobile',
      'Robust, scalable architecture',
      'Clean, intuitive UX',
      'Ongoing iteration support',
    ],
  },
  {
    slug: 'maintenance-support',
    icon: 'Wrench',
    title: 'Website Maintenance & Support',
    short: 'Keep your site fast, secure, and up to date with an ongoing care plan.',
    description:
      'Ongoing updates, monitoring, backups, and support so your website stays healthy long after launch day.',
    features: [
      'Regular updates & backups',
      'Uptime & security monitoring',
      'Priority support & fixes',
      'Monthly performance reports',
    ],
  },
]

export const PROJECT_PACKAGES = [
  {
    name: 'Starter',
    price: 'Starting from $1,200',
    description: 'A polished, professional site for small businesses getting online.',
    features: [
      'Up to 5 pages',
      'Mobile-responsive design',
      'Basic SEO setup',
      'Contact form',
      '2 rounds of revisions',
    ],
    popular: false,
  },
  {
    name: 'Business',
    price: 'Starting from $2,800',
    description: 'A custom-designed site built to grow with your business.',
    features: [
      'Up to 10 pages',
      'Custom design & animations',
      'Advanced SEO setup',
      'CMS for easy content updates',
      '4 rounds of revisions',
      '30 days post-launch support',
    ],
    popular: true,
  },
  {
    name: 'E-commerce',
    price: 'Starting from $4,500',
    description: 'A full online store, ready to take orders from day one.',
    features: [
      'Full storefront build',
      'Secure payment integration',
      'Product & inventory setup',
      'Order & customer management',
      '60 days post-launch support',
    ],
    popular: false,
  },
  {
    name: 'Custom',
    price: 'Let’s talk',
    description: 'Web or mobile apps, MVPs, and complex builds scoped around your needs.',
    features: [
      'Tailored scope & architecture',
      'Web and/or mobile app build',
      'Dedicated project lead',
      'Flexible engagement model',
    ],
    popular: false,
  },
]

export const MAINTENANCE_PLANS = [
  {
    name: 'Basic',
    price: '$49/mo',
    description: 'Essential upkeep so your site stays online and secure.',
    features: ['Uptime monitoring', 'Security & plugin updates', 'Monthly backups', 'Email support'],
    popular: false,
  },
  {
    name: 'Standard',
    price: '$99/mo',
    description: 'Regular care plus small content changes each month.',
    features: [
      'Everything in Basic',
      'Weekly backups',
      '2 hours of content updates/mo',
      'Performance monitoring',
      'Priority email support',
    ],
    popular: true,
  },
  {
    name: 'Premium',
    price: '$199/mo',
    description: 'Hands-on support for growing, high-traffic sites.',
    features: [
      'Everything in Standard',
      'Daily backups',
      '5 hours of updates/mo',
      'Monthly performance report',
      'Phone & priority support',
    ],
    popular: false,
  },
]

export const PROCESS_STEPS = [
  {
    icon: 'Search',
    title: 'Discovery',
    description: 'We learn about your business, goals, and audience to shape the right approach.',
  },
  {
    icon: 'PencilRuler',
    title: 'Planning & Design',
    description: 'We map out the structure and design a look and feel that fits your brand.',
  },
  {
    icon: 'Code2',
    title: 'Development',
    description: 'We build your site or app with clean, scalable, well-tested code.',
  },
  {
    icon: 'FlaskConical',
    title: 'Testing',
    description: 'We test across devices and browsers to catch issues before launch.',
  },
  {
    icon: 'Rocket',
    title: 'Deployment',
    description: 'We launch your project with a smooth, low-risk go-live process.',
  },
  {
    icon: 'HeartHandshake',
    title: 'Maintenance & Growth',
    description: 'We stick around to keep things running and help you grow.',
  },
]

export const WHY_CHOOSE_US = [
  {
    icon: 'MapPin',
    title: 'Local Perth Team',
    description: 'A real, local team you can meet, call, or catch up with over coffee.',
  },
  {
    icon: 'Workflow',
    title: 'End-to-End Service',
    description: 'From first idea to live product, we handle every step — no handoffs, no gaps.',
  },
  {
    icon: 'LifeBuoy',
    title: 'Ongoing Support',
    description: 'We don’t disappear after launch. Ongoing plans keep your site healthy.',
  },
  {
    icon: 'Gauge',
    title: 'Built for Speed',
    description: 'Fast, optimised builds that keep visitors — and search engines — happy.',
  },
]

export const STATS = [
  { label: 'Projects Delivered', value: 65, suffix: '+', icon: 'Rocket' },
  { label: 'Happy Clients', value: 48, suffix: '+', icon: 'Users' },
  { label: 'Years of Experience', value: 6, suffix: '+', icon: 'Calendar' },
  { label: 'Avg. Client Rating', value: 4.9, suffix: '/5', icon: 'Star' },
]

export const VALUES = [
  {
    icon: 'Smile',
    title: 'Friendly by Nature',
    description: 'Like our namesake, we bring a warm, approachable attitude to every project.',
  },
  {
    icon: 'ShieldCheck',
    title: 'Honest & Transparent',
    description: 'Clear pricing, clear timelines, and no surprises along the way.',
  },
  {
    icon: 'Sparkles',
    title: 'Quality First',
    description: 'We’d rather do it right than do it fast — though we’re pretty quick too.',
  },
  {
    icon: 'Users',
    title: 'Genuinely Collaborative',
    description: 'Your project, your input. We build with you, not just for you.',
  },
]

export const TEAM = [
  {
    name: 'Jordan Kelly',
    role: 'Founder & Lead Developer',
    bio: 'Full-stack developer who started WebQuokka to help Perth businesses get online without the agency runaround.',
  },
  {
    name: 'Sam Mitchell',
    role: 'Product & Design',
    bio: 'Focused on making sure every WebQuokka build looks great and feels effortless to use.',
  },
  {
    name: 'Alex Nguyen',
    role: 'Client Success',
    bio: 'Keeps projects on track and makes sure every client feels supported, start to finish.',
  },
]

export const TESTIMONIALS = [
  {
    name: 'Placeholder Client',
    designation: 'Owner, Local Perth Business',
    quote:
      'WebQuokka took our idea and turned it into a site we’re genuinely proud of. Communication was great the whole way through.',
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Placeholder Client',
    designation: 'E-commerce Store Owner',
    quote:
      'Our online store looks fantastic and the checkout flow is so smooth. Orders started coming in within days of launch.',
    src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
  },
  {
    name: 'Placeholder Client',
    designation: 'Startup Founder',
    quote:
      'They built our MVP fast without sacrificing quality. Investors were impressed with how polished it felt.',
    src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop',
  },
]

export const FAQS = [
  {
    question: 'How long does a website take?',
    answer:
      'Most business websites take 2–4 weeks from kickoff to launch, depending on scope. MVPs and e-commerce builds typically take 4–8 weeks. We’ll give you a clear timeline during our discovery call.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'Pricing depends on scope and complexity. Our project packages start from $1,200 for a Starter site — see our Pricing page for full package details, or get in touch for a free custom quote.',
  },
  {
    question: 'Do I own the code?',
    answer:
      'Yes. Once your project is paid in full, you own the code and content outright. There’s no vendor lock-in.',
  },
  {
    question: 'Do you provide hosting?',
    answer:
      'We can set up and manage hosting for you as part of a maintenance plan, or hand over deployment details if you’d prefer to host it yourself.',
  },
  {
    question: 'What’s included in maintenance?',
    answer:
      'Our maintenance plans cover updates, backups, uptime and security monitoring, and a set number of support hours each month. See the Pricing page for plan details.',
  },
  {
    question: 'Can you work with my existing website?',
    answer:
      'Often, yes. We can audit your current site and either improve it in place or plan a rebuild if that’s the better path — we’ll always recommend what makes sense for your budget and goals.',
  },
  {
    question: 'Do you work with businesses outside Perth?',
    answer:
      'Absolutely. While we’re proudly Perth-based, we work with clients across Australia and remotely worldwide.',
  },
]

export const SERVICE_OPTIONS = [
  'MVP Development',
  'Custom Business Website',
  'E-commerce Website',
  'Web & Mobile App Development',
  'Website Maintenance & Support',
  'Something else',
]

export const BUDGET_OPTIONS = [
  'Under $1,500',
  '$1,500 – $3,000',
  '$3,000 – $6,000',
  '$6,000 – $10,000',
  '$10,000+',
  'Not sure yet',
]
