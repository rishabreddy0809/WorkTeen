'use client'

import { useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'

// ─── Copy ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    title: 'A teen or parent posts a gig',
    body: 'Fill out the form: title, description, contact info, and pay. Takes two minutes.',
  },
  {
    num: '02',
    title: 'WorkTeen reviews it for safety',
    body: 'Rishab checks every submission before it goes live. No automated publishing.',
  },
  {
    num: '03',
    title: 'It goes live for nearby teens',
    body: 'Verified teen workers in your area see the listing and contact you directly in the app.',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
//
// Structure:
//   outerRef  div — 280vh tall, the scroll-distance container.
//   section   — sticky top-0, h-screen, pins to viewport while outerRef scrolls.
//   steps     — each keyed to a different range of scrollYProgress.
//
// scrollYProgress uses offset ["start start", "end end"] on the outer wrapper.
// With a 280vh container and 100vh viewport, the range is (280vh - 100vh) = 180vh
// of actual user scrolling (progress 0→1 over 180vh). Step breakdown:
//   Step 01: appears at  0%–22% progress  (~0–40vh of scroll)
//   Step 02: appears at 28%–50% progress  (~50–90vh of scroll)
//   Step 03: appears at 56%–78% progress  (~101–140vh of scroll)
//
// This means all 3 steps are fully visible by ~140vh, then there is ~40vh of
// "final dwell" before the section unpins, giving a deliberate pause at the end.

export default function HowItWorksSection() {
  const prefersReduced = useReducedMotion()
  const outerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  })

  // Each step maps to a distinct scroll range.
  // useTransform linearly interpolates within the given [in] → [out] ranges.
  const step1Opacity = useTransform(scrollYProgress, [0,    0.22], [0, 1])
  const step1Y       = useTransform(scrollYProgress, [0,    0.22], [40, 0])
  const step2Opacity = useTransform(scrollYProgress, [0.28, 0.50], [0, 1])
  const step2Y       = useTransform(scrollYProgress, [0.28, 0.50], [40, 0])
  const step3Opacity = useTransform(scrollYProgress, [0.56, 0.78], [0, 1])
  const step3Y       = useTransform(scrollYProgress, [0.56, 0.78], [40, 0])

  // Reduced motion: skip transforms, all steps shown immediately.
  const stepStyles = prefersReduced
    ? [
        { opacity: 1, y: 0 },
        { opacity: 1, y: 0 },
        { opacity: 1, y: 0 },
      ]
    : [
        { opacity: step1Opacity, y: step1Y },
        { opacity: step2Opacity, y: step2Y },
        { opacity: step3Opacity, y: step3Y },
      ]

  return (
    /*
     * The outer wrapper is intentionally taller than the viewport (280vh).
     * The inner section is sticky, so it pins to the top of the viewport while
     * the wrapper provides the scroll distance needed to drive the step animations.
     * Placing id="how-it-works" here so the "See how it works" anchor link
     * from the hero scrolls directly to this element.
     */
    <div
      ref={outerRef}
      id="how-it-works"
      style={{ height: '280vh' }}
      className="bg-void"
    >
      <section className="sticky top-0 h-screen flex flex-col justify-center bg-void border-t border-edge/40 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto w-full">
          {/* Label — static, appears as the section pins */}
          <p className="text-xs tracking-[0.2em] text-muted uppercase mb-16 text-center">
            How it works
          </p>

          {/*
           * Steps in a vertical column on mobile, 3-column grid on desktop.
           * On mobile the sequential scroll feel is immediately apparent.
           * On desktop all 3 are at the same vertical position so they animate
           * in concert — that is intentional, the desktop layout is a triptych.
           */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                style={{
                  ...stepStyles[i],
                  willChange: prefersReduced ? 'auto' : 'transform, opacity',
                }}
              >
                <div className="font-display text-5xl text-edge/55 mb-5 select-none">
                  {step.num}
                </div>
                <h3 className="font-body font-semibold text-ink mb-2">{step.title}</h3>
                <p className="font-body text-muted text-sm leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
