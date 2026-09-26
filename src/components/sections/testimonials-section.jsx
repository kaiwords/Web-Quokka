"use client";
import React, { useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/sections/card";
import { TimelineContent } from "@/components/sections/timeline-animation";
import { Star, Quote, CheckCheck, Building2, Sparkles, ThumbsUp } from "lucide-react";
import { motion } from "motion/react";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Owner, Bloom Florist",
    location: "Sydney, NSW",
    quote:
      "Web Quokka built our online store in just two weeks. Sales went up 40% in the first month. They made the whole process easy, friendly, and stress-free.",
    rating: 5,
    highlight: "+40% Online Sales",
    tag: "E-Commerce",
  },
  {
    name: "James Torres",
    role: "Founder, Torres Plumbing Co.",
    location: "Brisbane, QLD",
    quote:
      "I was skeptical at first, but the team delivered a professional studio site that actually gets us new leads every day. Best investment we have made for our trade business.",
    rating: 5,
    highlight: "3x More Monthly Leads",
    tag: "Service Website",
  },
  {
    name: "Priya Nair",
    role: "CEO, NairFit Studio",
    location: "Perth, WA",
    quote:
      "Our booking app is slick, fast, and our clients love it. The ongoing support has been incredible — they are always there when we need new features or updates.",
    rating: 5,
    highlight: "100% Automated Bookings",
    tag: "Web Application",
  },
  {
    name: "Marcus Lee",
    role: "Director, Lee & Associates",
    location: "Melbourne, VIC",
    quote:
      "From design to cloud hosting, Web Quokka handled everything with perfection. The site looks premium, loads instantly, and we didn't have to lift a finger.",
    rating: 5,
    highlight: "Turnkey Studio Setup",
    tag: "Corporate Site",
  },
];

function initialsOf(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function TestimonialsSection() {
  const sectionRef = useRef(null);

  const revealVariants = {
    visible: (i) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.12,
        duration: 0.55,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="py-24 px-4 bg-[#422b1c] text-[#FAF8F5] relative overflow-hidden"
    >
      {/* Background glow radial */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 158, 125, 0.4) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <TimelineContent
            as="div"
            animationNum={0}
            timelineRef={sectionRef}
            customVariants={revealVariants}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3A5A40]/40 border border-[#8B9E7D]/40 text-[#8B9E7D] text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Sparkles size={14} /> Client Stories & Reviews
          </TimelineContent>

          <TimelineContent
            as="h2"
            animationNum={1}
            timelineRef={sectionRef}
            customVariants={revealVariants}
            className="text-4xl md:text-5xl font-serif font-bold text-[#FAF8F5] mb-4 leading-tight"
          >
            Trusted by small businesses{" "}
            <span className="italic text-[#8B9E7D] font-normal">across Australia</span>
          </TimelineContent>

          <TimelineContent
            as="p"
            animationNum={2}
            timelineRef={sectionRef}
            customVariants={revealVariants}
            className="text-base text-neutral-300 max-w-xl mx-auto"
          >
            Real results from business owners who upgraded their digital presence with Web Quokka studio design.
          </TimelineContent>

          {/* Social Proof Badges */}
          <TimelineContent
            as="div"
            animationNum={3}
            timelineRef={sectionRef}
            customVariants={revealVariants}
            className="flex flex-wrap justify-center gap-6 mt-8 pt-6 border-t border-white/10"
          >
            <div className="flex items-center gap-2 text-sm text-neutral-300">
              <div className="flex text-[#8B9E7D]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <span className="font-bold text-white">4.9/5 Average Rating</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-300">
              <ThumbsUp size={16} className="text-[#8B9E7D]" />
              <span className="font-semibold">100% Client Satisfaction</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-300">
              <CheckCheck size={16} className="text-[#8B9E7D]" />
              <span className="font-semibold">Verified Client Reviews</span>
            </div>
          </TimelineContent>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, index) => (
            <TimelineContent
              key={t.name}
              as="div"
              animationNum={4 + index}
              timelineRef={sectionRef}
              customVariants={revealVariants}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm rounded-2xl p-6 h-full flex flex-col justify-between hover:border-[#8B9E7D]/50 hover:-translate-y-1.5 transition-all duration-300 group shadow-lg">
                <div>
                  {/* Top Bar: Stars + Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex text-[#8B9E7D]">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} size={15} fill="currentColor" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#3A5A40]/60 text-[#FAF8F5] border border-[#8B9E7D]/30">
                      {t.tag}
                    </span>
                  </div>

                  {/* Quote */}
                  <div className="relative mb-6">
                    <Quote className="text-[#8B9E7D]/20 absolute -top-2 -left-2 w-8 h-8" />
                    <p className="text-sm text-neutral-200 italic leading-relaxed relative z-10">
                      "{t.quote}"
                    </p>
                  </div>
                </div>

                {/* Bottom: Client Profile + Highlight */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        aria-hidden="true"
                        className="w-10 h-10 shrink-0 rounded-full border border-[#8B9E7D] bg-[#3A5A40]/40 flex items-center justify-center text-xs font-bold text-[#FAF8F5]"
                      >
                        {initialsOf(t.name)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-[#8B9E7D] transition-colors">
                          {t.name}
                        </h4>
                        <p className="text-xs text-neutral-400">{t.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Impact badge */}
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B9E7D] bg-[#3A5A40]/30 px-2.5 py-1 rounded-lg w-full justify-center border border-[#8B9E7D]/20">
                    <CheckCheck size={13} /> {t.highlight}
                  </div>
                </div>
              </Card>
            </TimelineContent>
          ))}
        </div>
      </div>
    </section>
  );
}
