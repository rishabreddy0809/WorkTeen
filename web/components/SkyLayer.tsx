'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import type { CSSProperties } from 'react'

// Duration constants — easy to tune in one place
const CLOUD_DUR = 38  // seconds for a full left→right crossing (was 80s, halved)
const BIRD_DUR  = 22  // birds cross faster than clouds

// Cloud blob: 4 overlapping rounded divs — dark, barely distinguishable from sky
function CloudBlob({
  topPct,
  delay,
  paused,
  staticLeftPct,
}: {
  topPct: string
  delay: number
  paused: boolean
  staticLeftPct: string
}) {
  const container: CSSProperties = {
    position: 'absolute',
    top: topPct,
    left: paused ? staticLeftPct : '-290px',
    width: 270,
    height: 76,
    animation: paused ? 'none' : `workteen-drift ${CLOUD_DUR}s ${delay}s linear infinite`,
    opacity: 0.85,
    pointerEvents: 'none',
  }
  const blob = (l: number, t: number, w: number, h: number): CSSProperties => ({
    position: 'absolute', left: l, top: t, width: w, height: h,
    borderRadius: '50%', background: '#1c1e30',
  })
  return (
    <div style={container}>
      <div style={blob(44,  18, 155, 52)} />
      <div style={blob(0,   28,  92, 44)} />
      <div style={blob(105, 10, 102, 50)} />
      <div style={blob(72,   0,  94, 46)} />
    </div>
  )
}

// Bird: a tiny M/W wing shape made from an SVG path
function Bird({
  topPct,
  delay,
  paused,
  staticLeftPct,
  scale = 1,
}: {
  topPct: string
  delay: number
  paused: boolean
  staticLeftPct: string
  scale?: number
}) {
  const container: CSSProperties = {
    position: 'absolute',
    top: topPct,
    left: paused ? staticLeftPct : '-50px',
    animation: paused ? 'none' : `workteen-drift ${BIRD_DUR}s ${delay}s linear infinite`,
    opacity: 0.5,
    pointerEvents: 'none',
  }
  const w = Math.round(32 * scale)
  const h = Math.round(14 * scale)
  return (
    <div style={container}>
      <svg width={w} height={h} viewBox="-18 -8 36 16" style={{ display: 'block' }}>
        {/* Simple gull-wing M shape: two curved arcs meeting at center */}
        <path
          d="M-16,4 C-12,-4 -7,-6 0,0 C7,-6 12,-4 16,4"
          stroke="#9a8a5e"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}

export default function SkyLayer({ y }: { y: MotionValue<number> | number }) {
  const reduced = useReducedMotion() ?? false

  // Cloud stagger = CLOUD_DUR / 3 ≈ 12.7 s
  // Bird stagger  = BIRD_DUR  / 2 = 11 s
  return (
    <motion.div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        y,
        willChange: 'transform',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      <style>{`
        @keyframes workteen-drift {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(100vw + 580px)); }
        }
      `}</style>

      {/* Three clouds, evenly staggered across the 38 s cycle */}
      <CloudBlob topPct="7%"  delay={0}          paused={reduced} staticLeftPct="9%"  />
      <CloudBlob topPct="15%" delay={-CLOUD_DUR / 3}   paused={reduced} staticLeftPct="43%" />
      <CloudBlob topPct="4%"  delay={-CLOUD_DUR * 2/3} paused={reduced} staticLeftPct="72%" />

      {/* Two birds — faster than clouds, at different heights */}
      <Bird topPct="20%" delay={0}            paused={reduced} staticLeftPct="30%" />
      <Bird topPct="26%" delay={-BIRD_DUR / 2} paused={reduced} staticLeftPct="60%" scale={0.78} />
    </motion.div>
  )
}
