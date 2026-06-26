'use client'

import { motion, useReducedMotion } from 'framer-motion'

const FEATURES = [
  {
    icon: '✓',
    title: 'Verified listings',
    body: 'Every post is reviewed before it appears in the app. No fake postings, no bait-and-switch.',
  },
  {
    icon: '→',
    title: 'Real contact info',
    body: 'Every listing has a direct phone number. Teens can actually reach you. No forms, no chatbots.',
  },
  {
    icon: '○',
    title: 'Built for teen schedules',
    body: 'Age requirements and school-day hour limits are part of every listing. No surprises at the door.',
  },
]

export default function FeaturesSection() {
  const prefersReduced = useReducedMotion()

  return (
    <section className="py-24 px-6 bg-void">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="card group hover:-translate-y-1 hover:border-edge/70 transition-all duration-200"
              // Simple whileInView: this section doesn't need scroll-linking,
              // just a clean entrance as it comes into the viewport once.
              initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
              whileInView={prefersReduced ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.55,
                delay: i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <span
                className="block font-mono text-gold text-base mb-5 select-none"
                aria-hidden
              >
                {f.icon}
              </span>
              <h3 className="font-body font-semibold text-ink mb-2">{f.title}</h3>
              <p className="font-body text-muted text-sm leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
