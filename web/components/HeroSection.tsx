'use client'

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { collection, getCountFromServer } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// ─── Animated counter hook ────────────────────────────────────────────────────

function useAnimatedCount(target: number, durationMs = 1400, delayMs = 1600) {
  const [count, setCount] = useState(0)
  const prefersReduced = useReducedMotion()
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (target === 0) return
    if (prefersReduced) { setCount(target); return }

    const timer = setTimeout(() => {
      const start = Date.now()
      const tick = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / durationMs, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
        setCount(Math.round(eased * target))
        if (progress < 1) frameRef.current = requestAnimationFrame(tick)
      }
      frameRef.current = requestAnimationFrame(tick)
    }, delayMs)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frameRef.current)
    }
  }, [target, durationMs, delayMs, prefersReduced])

  return count
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HEADLINE_LINES = [
  { text: 'Real gigs.',   gold: false },
  { text: 'Real teens.',  gold: false },
  { text: ['Actually ', 'hired.'] as [string, string], gold: true },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function HeroSection() {
  const prefersReduced = useReducedMotion()
  const [listingCount, setListingCount] = useState<number | null>(null)
  const displayCount = useAnimatedCount(listingCount ?? 0, 1400, 1600)

  // Refs for two separate scroll targets:
  // outerRef  — the 160vh scroll-distance wrapper (gives the sticky "linger" space)
  // innerRef  — the sticky section itself (not tracked, just styled)
  const outerRef = useRef<HTMLDivElement>(null)

  // Track scroll through the outer wrapper.
  // offset ["start start", "end start"] = progress 0→1 as the wrapper's
  // bottom scrolls past the TOP of the viewport, giving 160vh of range.
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end start'],
  })

  // Hero content fades out and scales down while the wrapper is scrolling.
  // Starts fading at 10% scroll progress, fully gone at 65%.
  const contentOpacity = useTransform(scrollYProgress, [0.1, 0.65], [1, 0])
  const contentScale   = useTransform(scrollYProgress, [0.1, 0.65], [1, 0.91])
  const contentY       = useTransform(scrollYProgress, [0.1, 0.65], [0, -48])

  // Reduced motion: skip all scroll transforms, show content in final visible state.
  const scrollStyle = prefersReduced
    ? {}
    : { opacity: contentOpacity, scale: contentScale, y: contentY }

  useEffect(() => {
    getCountFromServer(collection(db, 'jobListings'))
      .then(snap => setListingCount(snap.data().count))
      .catch(() => setListingCount(null))
  }, [])

  const d = (ms: number) => (prefersReduced ? 0 : ms / 1000)

  const lineVariants = {
    hidden:  { opacity: 0, y: prefersReduced ? 0 : 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    /*
     * Outer container: 160vh gives the sticky section extra scroll real-estate
     * so the hero content can visibly dissolve before the next section appears.
     * The inner section is position:sticky so it pins to the viewport top while
     * scrollYProgress drives the content transforms above.
     */
    <div ref={outerRef} style={{ height: '160vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <section
          className="relative h-full flex items-center justify-center bg-void pt-16"
          aria-label="Hero"
        >
          {/*
           * THE AMBIENT GLOW — the single decorative element on the site.
           * Radial gold gradient, breathing at 4s intervals via CSS keyframes.
           * The CSS @media prefers-reduced-motion block in globals.css freezes it.
           */}
          <div
            className="gold-glow pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 h-[480px]"
            style={{
              background:
                'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(245,166,35,0.09) 0%, rgba(245,166,35,0.03) 45%, transparent 70%)',
            }}
            aria-hidden
          />

          {/*
           * Content wrapper — scroll transforms (opacity/scale/y) apply here.
           * Load-in animations live on the children inside so both can coexist:
           * children animate in on mount, then the wrapper fades out on scroll.
           */}
          <motion.div
            className="relative z-10 max-w-4xl mx-auto px-6 text-center"
            style={{
              ...scrollStyle,
              willChange: prefersReduced ? 'auto' : 'transform, opacity',
            }}
          >
            {/* BEAT 1 — Gold rule extends from center. The interface waking up. */}
            <motion.div
              className="h-px bg-gold/55 mx-auto mb-10"
              style={{ width: 72, transformOrigin: 'center' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: d(620), ease: 'easeOut' }}
            />

            {/* Tagline — arrives quietly before the headline */}
            <motion.p
              className="text-xs font-body font-medium tracking-[0.22em] text-muted uppercase mb-8 select-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: d(400), delay: d(280) }}
            >
              Built by a teen. For teens. For real.
            </motion.p>

            {/*
             * BEAT 2 — Headline lines rise in sequence.
             * Playfair Display at clamp(3.2–6.8rem) is the one aesthetic risk:
             * a traditional editorial serif on a modern dark interface.
             */}
            <h1
              className="font-display leading-[1.06] mb-8"
              style={{ fontSize: 'clamp(3.2rem, 9vw, 6.8rem)' }}
            >
              {HEADLINE_LINES.map((line, i) => (
                <motion.span
                  key={i}
                  className="block"
                  variants={lineVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{
                    duration: d(520),
                    delay: d(480 + i * 140),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {Array.isArray(line.text) ? (
                    <>
                      <span className="text-gold">{line.text[0]}</span>
                      {line.text[1]}
                    </>
                  ) : (
                    line.text
                  )}
                </motion.span>
              ))}
            </h1>

            {/* BEAT 3 — Subtext and CTA materialise after headline settles */}
            <motion.p
              className="font-body text-muted text-lg leading-relaxed max-w-[42ch] mx-auto mb-10"
              initial={{ opacity: 0, y: prefersReduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: d(480), delay: d(1060), ease: [0.16, 1, 0.3, 1] }}
            >
              Rishab got tired of being ghosted by job applications, so he built WorkTeen: verified local gigs for teens, real contact info, no middlemen.
            </motion.p>

            {/* Live Firestore stat — only renders once count is known */}
            {listingCount !== null && (
              <motion.p
                className="font-body text-sm text-muted mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: d(400), delay: d(1300) }}
              >
                <span className="text-gold font-semibold tabular-nums">{displayCount}</span>
                {' '}verified listing{listingCount !== 1 ? 's' : ''} in the app · reviewed, not scraped
              </motion.p>
            )}

            {/* CTA row */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: d(300), delay: d(1480), ease: 'easeOut' }}
            >
              <Link href="/post-job" className="btn-primary px-8 py-3.5 text-base">
                Post a Gig for a Teen →
              </Link>
              {/*
               * "See how it works" scrolls to #how-it-works via native smooth scroll.
               * The id="how-it-works" lives on HowItWorksSection rendered in page.tsx.
               */}
              <a
                href="#how-it-works"
                className="font-body text-sm text-muted hover:text-ink transition-colors duration-200"
              >
                See how it works ↓
              </a>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
