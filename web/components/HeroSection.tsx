'use client'

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { collection, getCountFromServer } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const VantaFogBackground = dynamic(
  () => import('./VantaFogBackground'),
  { ssr: false },
)

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
  { text: 'Real gigs.',                                  gold: false },
  { text: 'Real teens.',                                 gold: false },
  { text: ['Actually', ' hired.'] as [string, string],  gold: true  },
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

  const [dotExpanded, setDotExpanded] = useState(false)

  useEffect(() => {
    if (prefersReduced) { setDotExpanded(true); return }
    const timer = setTimeout(() => setDotExpanded(true), 4200)
    return () => clearTimeout(timer)
  }, [prefersReduced])

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
          {/* Vanta Fog background — gold/amber palette, full-bleed behind all content */}
          <VantaFogBackground />

          {/* Readability overlay — ensures text contrast over the fog's bright peaks */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              background: 'rgba(10, 10, 14, 0.42)',
            }}
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
                      {/* "Actually" — each letter waves in small→big with a staggered spring */}
                      <span style={{ color: '#F5A623', display: 'inline-block' }}>
                        {line.text[0].split('').map((char, ci) => (
                          <motion.span
                            key={ci}
                            style={{ display: 'inline-block' }}
                            initial={prefersReduced ? {} : { scale: 0.1, opacity: 0 }}
                            animate={prefersReduced ? {} : { scale: 1, opacity: 1 }}
                            transition={prefersReduced ? {} : {
                              type: 'spring',
                              stiffness: 500,
                              damping: 13,
                              delay: 0.9 + ci * 0.06,
                            }}
                          >
                            {char}
                          </motion.span>
                        ))}
                      </span>
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
              {/* Gold dot that expands into the "See how it works" pill */}
              <motion.a
                href="#how-it-works"
                className="font-body text-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  borderStyle: 'solid',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
                animate={{
                  width:           dotExpanded ? 220 : 52,
                  height:          52,
                  borderRadius:    26,
                  backgroundColor: '#F5A623',
                  borderColor:     '#F5A623',
                  borderWidth:     0,
                  color:           dotExpanded ? '#1a0c02' : 'rgba(0,0,0,0)',
                }}
                initial={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: '#F5A623', borderColor: '#F5A623', borderWidth: 0,
                  color: 'rgba(0,0,0,0)',
                }}
                transition={{
                  width:        { duration: d(700), ease: [0.16, 1, 0.3, 1] },
                  height:       { duration: d(650), ease: [0.16, 1, 0.3, 1] },
                  borderRadius: { duration: d(700), ease: [0.16, 1, 0.3, 1] },
                  color:        { duration: d(300), delay: dotExpanded ? d(450) : 0 },
                }}
              >
                See how it works ↓
              </motion.a>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
