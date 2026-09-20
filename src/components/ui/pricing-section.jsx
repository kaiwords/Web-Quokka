"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimelineContent } from "@/components/ui/timeline-animation";
import NumberFlow from "@number-flow/react";
import {
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Code2,
  MapPin,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useRef, useState } from "react";

const plans = [
  {
    name: "Starter Package",
    badge: "Essential Studio Site",
    description:
      "Ideal for small businesses, trades, & startups wanting a high-converting, 5-page studio website.",
    price: 699,
    buttonText: "Choose Starter Plan",
    buttonVariant: "outline",
    features: [
      "Up to 5 custom responsive pages",
      "Mobile & speed performance optimized",
      "Google Maps & basic SEO setup",
      "Contact & lead enquiry form",
    ],
  },
  {
    name: "Growth Package",
    badge: "Complete Business Solution",
    description:
      "Best value for growing businesses requiring a full studio site, CMS blog, or product catalog.",
    price: 1199,
    buttonText: "Get Started with Growth",
    buttonVariant: "default",
    popular: true,
    features: [
      "Up to 12 custom studio pages",
      "CMS Blog & catalog integration",
      "Google Analytics & On-Page SEO strategy",
      "Custom UI/UX studio design",
      "3 rounds of design revisions",
    ],
  },
  {
    name: "Pro Bespoke",
    badge: "Custom Web App & Systems",
    description:
      "Advanced bespoke solution for web applications, client portals, e-commerce & complex integrations.",
    price: 2499,
    buttonText: "Talk to Us About Pro",
    buttonVariant: "outline",
    features: [
      "Unlimited bespoke pages & screens",
      "REST API & Database architecture",
      "Stripe & custom payment integration",
      "Role-based user authentication",
      "Advanced SEO & custom analytics",
    ],
  },
];

const guarantees = [
  {
    icon: <Zap className="w-5 h-5 text-[#3A5A40]" />,
    title: "14–21 Day Turnaround",
    desc: "Guaranteed speed to market with fixed timelines.",
  },
  {
    icon: <Code2 className="w-5 h-5 text-[#3A5A40]" />,
    title: "100% Code Ownership",
    desc: "Pay once. You own all design files & code forever.",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-[#3A5A40]" />,
    title: "Zero Locked Contracts",
    desc: "No hidden recurring charges or surprise fees.",
  },
  {
    icon: <MapPin className="w-5 h-5 text-[#3A5A40]" />,
    title: "Australian Studio Team",
    desc: "Direct contact with our Perth-based developers.",
  },
];

const faqs = [
  {
    q: "Are there any hidden monthly fees?",
    a: "No! All our web packages are pay-once, own-it-forever. Optional managed care plans are available if you want us to handle hosting, updates, and backups.",
  },
  {
    q: "How long does a website take to build?",
    a: "Starter packages take 14 days guaranteed. Growth packages take 21 days. Custom Pro web applications take 3 to 5 weeks depending on scope.",
  },
  {
    q: "Can I update the website content myself?",
    a: "Absolutely! We build with easy-to-use content management tools and provide video training so you can edit text, images, and blog posts effortlessly.",
  },
  {
    q: "Do you handle domain names and cloud hosting?",
    a: "Yes. We can set up high-speed cloud hosting with free SSL security, or seamlessly connect your website to your existing domain registrar.",
  },
];

export default function PricingSection() {
  const [openFaq, setOpenFaq] = useState(null);
  const pricingRef = useRef(null);

  const revealVariants = {
    visible: (i) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(8px)",
      y: -16,
      opacity: 0,
    },
  };

  return (
    <div
      id="pricing"
      className="px-4 pt-20 pb-24 mx-auto relative bg-[#FAF8F5] overflow-hidden"
      ref={pricingRef}
    >
      {/* Soft Ambient Radial Background */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] pointer-events-none opacity-40 z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(58, 90, 64, 0.15) 0%, rgba(66, 43, 28, 0.05) 50%, transparent 75%)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <TimelineContent
            as="div"
            animationNum={0}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3A5A40]/10 border border-[#3A5A40]/30 text-[#3A5A40] text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Sparkles size={14} /> Transparent Studio Pricing
          </TimelineContent>

          <TimelineContent
            as="h2"
            animationNum={1}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="md:text-5xl sm:text-4xl text-3xl font-serif font-bold text-[#422b1c] mb-4 tracking-tight leading-tight"
          >
            Packages crafted for your{" "}
            <span className="border border-dashed border-[#3A5A40] px-3.5 py-0.5 rounded-xl bg-[#e3ebe5] capitalize inline-block text-[#3A5A40]">
              business
            </span>
          </TimelineContent>

          <TimelineContent
            as="p"
            animationNum={2}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="sm:text-base text-sm text-[#6b635c] sm:w-[80%] w-[90%] mx-auto leading-relaxed"
          >
            Clear upfront pricing built for Australian small businesses. Pay once, own 100% of your site & code with zero locked contracts.
          </TimelineContent>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8 max-w-7xl mx-auto mb-16 items-stretch">
          {plans.map((plan, index) => (
            <TimelineContent
              key={plan.name}
              as="div"
              animationNum={4 + index}
              timelineRef={pricingRef}
              customVariants={revealVariants}
              className="flex"
            >
              <div
                className={`w-full rounded-2xl transition-all duration-300 flex flex-col justify-between relative ${
                  plan.popular
                    ? "bg-[#ffffff] border-2 border-[#3A5A40] shadow-xl ring-4 ring-[#3A5A40]/10 transform lg:-translate-y-2"
                    : "bg-[#ffffff] border border-[#E2DED7] shadow-sm hover:shadow-lg hover:border-[#3A5A40]/40"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#3A5A40] to-[#2d4632] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 z-20">
                    <Sparkles size={12} className="text-[#8B9E7D]" />
                    Most Popular Studio Choice
                  </div>
                )}

                <div>
                  <CardHeader className="pt-8 pb-6 px-7 text-left border-b border-[#F4F0EA]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-[#422b1c]">
                          {plan.name}
                        </h3>
                        <span className="text-xs font-bold text-[#3A5A40] uppercase tracking-wider block mt-1">
                          {plan.badge}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-[#6b635c] mt-2 mb-4 leading-relaxed min-h-[40px]">
                      {plan.description}
                    </p>

                    <div className="flex items-baseline mt-4">
                      <span className="text-4xl sm:text-5xl font-serif font-bold text-[#422b1c] tracking-tight">
                        $
                        <NumberFlow
                          value={plan.price}
                          className="text-4xl sm:text-5xl font-serif font-bold text-[#422b1c]"
                        />
                      </span>
                      <span className="text-[#6b635c] ml-2.5 text-xs sm:text-sm font-semibold">
                        AUD / one-time
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-7">
                    <a
                      href="#contact"
                      className={`w-full flex items-center justify-center gap-2 text-center py-3.5 px-6 text-sm font-bold rounded-xl transition-all duration-200 shadow-sm ${
                        plan.popular
                          ? "bg-gradient-to-r from-[#3A5A40] to-[#2d4632] text-white hover:opacity-95 shadow-md shadow-[#3A5A40]/25"
                          : "bg-[#422b1c] text-white hover:bg-[#312015]"
                      }`}
                    >
                      {plan.buttonText}
                      <ArrowRight size={16} />
                    </a>

                    <div className="py-6">
                      <p className="text-xs font-bold text-[#422b1c] uppercase tracking-wider mb-4">
                        Core Features Included:
                      </p>
                      <ul className="space-y-3 font-medium">
                        {plan.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start text-left">
                            <span className="h-5 w-5 rounded-full bg-[#3A5A40]/10 border border-[#3A5A40]/30 text-[#3A5A40] flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                              <CheckCircle2 size={13} />
                            </span>
                            <span className="text-sm text-[#422b1c] leading-snug">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </CardContent>
                </div>
              </div>
            </TimelineContent>
          ))}
        </div>

        {/* Guarantees Banner Grid */}
        <TimelineContent
          as="div"
          animationNum={7}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="bg-[#ffffff] border border-[#E2DED7] rounded-2xl p-6 sm:p-8 shadow-sm mb-16"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {guarantees.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3.5">
                <div className="p-2.5 bg-[#FAF8F5] border border-[#E2DED7] rounded-xl flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#422b1c] font-serif">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#6b635c] mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TimelineContent>

        {/* FAQ Section */}
        <TimelineContent
          as="div"
          animationNum={8}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="max-w-3xl mx-auto text-left"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#422b1c] mb-2">
              Frequently Asked Questions
            </h3>
            <p className="text-sm text-[#6b635c]">
              Everything you need to know about our pricing and studio delivery process.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-[#ffffff] border border-[#E2DED7] rounded-xl overflow-hidden transition-all duration-200 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left font-bold text-[#422b1c] text-sm sm:text-base flex justify-between items-center gap-4 hover:bg-[#FAF8F5] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#3A5A40] transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-sm text-[#6b635c] leading-relaxed border-t border-[#F4F0EA] pt-3">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </TimelineContent>
      </div>
    </div>
  );
}
