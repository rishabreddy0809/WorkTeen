'use client'

import { useEffect, useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'

// Video files — drop these into /web/public/demos/
// app-demo.mp4  →  iOS app recording
// site-demo.mp4 →  post-job web flow recording

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

const DEMO_HEIGHT = 'min(640px, calc(100vh - 240px))'

export default function HowItWorksSection() {
  const prefersReduced = useReducedMotion()
  const outerRef  = useRef<HTMLDivElement>(null)
  const appVidRef  = useRef<HTMLVideoElement>(null)
  const siteVidRef = useRef<HTMLVideoElement>(null)

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  })

  const step1Opacity = useTransform(scrollYProgress, [0,    0.22], [0, 1])
  const step1Y       = useTransform(scrollYProgress, [0,    0.22], [40, 0])
  const step2Opacity = useTransform(scrollYProgress, [0.28, 0.50], [0, 1])
  const step2Y       = useTransform(scrollYProgress, [0.28, 0.50], [40, 0])
  const step3Opacity = useTransform(scrollYProgress, [0.56, 0.78], [0, 1])
  const step3Y       = useTransform(scrollYProgress, [0.56, 0.78], [40, 0])

  // Videos fade in after step 03 is fully visible
  const videosOpacity = useTransform(scrollYProgress, [0.78, 0.92], [0, 1])
  const videosY       = useTransform(scrollYProgress, [0.78, 0.92], [28, 0])

  const stepStyles = prefersReduced
    ? [{ opacity: 1, y: 0 }, { opacity: 1, y: 0 }, { opacity: 1, y: 0 }]
    : [
        { opacity: step1Opacity, y: step1Y },
        { opacity: step2Opacity, y: step2Y },
        { opacity: step3Opacity, y: step3Y },
      ]

  // Respect prefers-reduced-motion: pause both videos
  useEffect(() => {
    if (!prefersReduced) return
    appVidRef.current?.pause()
    siteVidRef.current?.pause()
  }, [prefersReduced])

  return (
    <div
      ref={outerRef}
      id="how-it-works"
      style={{ height: '360vh' }}
      className="bg-void"
    >
      <section className="sticky top-0 h-screen flex flex-col justify-center bg-void border-t border-edge/40 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-8">

          <p className="text-xs tracking-[0.2em] text-muted uppercase text-center">
            How it works
          </p>

          {/* Steps */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
            <div
              aria-hidden
              className="hidden md:block absolute inset-x-0 top-[22px] h-px bg-edge/30 pointer-events-none"
            />
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                style={{
                  ...stepStyles[i],
                  willChange: prefersReduced ? 'auto' : 'transform, opacity',
                }}
              >
                <div className="relative z-10 w-11 h-11 rounded-full border border-gold/50 bg-void flex items-center justify-center mb-4 select-none">
                  <span className="font-body text-xs font-semibold text-gold/70 tabular-nums">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-body font-semibold text-ink mb-2">{step.title}</h3>
                <p className="font-body text-muted text-sm leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Videos — appear after step 03 settles */}
          {/* ROW_H drives both frames to the same height. Website width = ROW_H × 16/10.
              iPhone outer height = ROW_H; inner screen = ROW_H - 24px (padding); width auto. */}
          <div className="w-fit mx-auto -translate-x-3">
          <motion.div
            style={{
              opacity:    prefersReduced ? 1 : videosOpacity,
              y:          prefersReduced ? 0 : videosY,
              willChange: prefersReduced ? 'auto' : 'transform, opacity',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
            {/* Website demo — fixed height, width auto via aspect-ratio */}
            <div
              style={{
                height: DEMO_HEIGHT,
                aspectRatio: '16/10',
                borderRadius: 12,
                border: '1.5px solid #2A2A38',
                background: '#1A1A24',
                flexShrink: 0,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <video
                ref={siteVidRef}
                src="/demos/site-demo.mp4"
                autoPlay={!prefersReduced}
                loop
                muted
                playsInline
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            {/* App demo — iPhone frame, same height as the website demo.
                Inner screen = demo height minus the frame padding.
                Width is determined by screen aspect ratio 9/19.5. */}
            <div style={{
              height:       DEMO_HEIGHT,
              background:   '#1A1A24',
              borderRadius: 38,
              border:       '1.5px solid #2A2A38',
              padding:      12,
              boxShadow:    'inset 0 0 0 5px #0F0F13, 0 24px 60px rgba(0,0,0,0.4)',
              position:     'relative',
              flexShrink:   0,
            }}>
              {/* Volume buttons */}
              <div style={{ position: 'absolute', left: -3, top: 56, width: 3, height: 16, background: '#2A2A38', borderRadius: '2px 0 0 2px' }} />
              <div style={{ position: 'absolute', left: -3, top: 78, width: 3, height: 16, background: '#2A2A38', borderRadius: '2px 0 0 2px' }} />
              {/* Power button */}
              <div style={{ position: 'absolute', right: -3, top: 66, width: 3, height: 30, background: '#2A2A38', borderRadius: '0 2px 2px 0' }} />

              {/* Screen — fills the padding box; aspect ratio drives phone width */}
              <div style={{
                height: '100%',
                aspectRatio: '9/19.5',
                borderRadius: 30,
                overflow: 'hidden',
                position: 'relative',
                background: '#0F0F13',
              }}>
                {/* Dynamic island */}
                <div style={{
                  position: 'absolute', top: 6, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 44, height: 13,
                  background: '#0A0A0E', borderRadius: 7, zIndex: 10,
                }} />

                <video
                  ref={appVidRef}
                  src="/demos/app-demo.mp4"
                  autoPlay={!prefersReduced}
                  loop
                  muted
                  playsInline
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Home indicator */}
                <div style={{
                  position: 'absolute', bottom: 5, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 44, height: 3,
                  background: '#2A2A38', borderRadius: 2, zIndex: 10,
                }} />
              </div>
            </div>
          </motion.div>
          </div>

        </div>
      </section>
    </div>
  )
}
