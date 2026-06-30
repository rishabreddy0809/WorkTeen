'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

const FEATURES = [
  {
    Icon: CheckIcon,
    title: 'Verified listings',
    body: 'Every post is reviewed before it appears in the app. No fake postings, no bait-and-switch.',
  },
  {
    Icon: PhoneIcon,
    title: 'Real contact info',
    body: 'Every listing has a direct phone number. Teens can actually reach you. No forms, no chatbots.',
  },
  {
    Icon: ClockIcon,
    title: 'Built for teen schedules',
    body: 'Age requirements and school-day hour limits are part of every listing. No surprises at the door.',
  },
]

export default function FeaturesSection() {
  const prefersReduced = useReducedMotion()
  const outerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  })

  // Each card fades + rises in on its own scroll range, same pattern as HowItWorksSection
  const card1Opacity = useTransform(scrollYProgress, [0,    0.22], [0, 1])
  const card1Y       = useTransform(scrollYProgress, [0,    0.22], [40, 0])
  const card2Opacity = useTransform(scrollYProgress, [0.28, 0.50], [0, 1])
  const card2Y       = useTransform(scrollYProgress, [0.28, 0.50], [40, 0])
  const card3Opacity = useTransform(scrollYProgress, [0.56, 0.78], [0, 1])
  const card3Y       = useTransform(scrollYProgress, [0.56, 0.78], [40, 0])

  const cardStyles = prefersReduced
    ? [
        { opacity: 1, y: 0 },
        { opacity: 1, y: 0 },
        { opacity: 1, y: 0 },
      ]
    : [
        { opacity: card1Opacity, y: card1Y },
        { opacity: card2Opacity, y: card2Y },
        { opacity: card3Opacity, y: card3Y },
      ]

  return (
    <div ref={outerRef} style={{ height: '280vh' }} className="bg-gold">
      <section className="sticky top-0 h-screen flex flex-col justify-center px-6 bg-gold">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 py-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                style={{
                  opacity: cardStyles[i].opacity,
                  y: cardStyles[i].y,
                  willChange: prefersReduced ? 'auto' : 'transform, opacity',
                }}
                className="relative flex flex-col bg-surface border border-edge rounded-2xl p-10
                           hover:border-gold/40 hover:z-10
                           hover:shadow-[0_20px_60px_rgba(245,166,35,0.18)]"
                whileHover={prefersReduced ? {} : {
                  scale: 1.1,
                  transition: { type: 'spring', stiffness: 280, damping: 18 },
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-gold flex-shrink-0"
                  style={{ background: 'rgba(245, 166, 35, 0.12)' }}
                >
                  <f.Icon />
                </div>
                <h3 className="font-body font-semibold text-ink text-lg mb-3">{f.title}</h3>
                <p className="font-body text-muted text-sm leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
