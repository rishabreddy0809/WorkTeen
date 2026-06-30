'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { MotionValue } from 'framer-motion'

// Warm amber — distinct from UI gold, reads as an illustration element
const FILL = '#C8A86A'

/*
 * Teen + lawn mower silhouette — road-sign pictogram style, very minimal.
 * Total figure height: ~202 SVG units.
 * translate(430, 770): feet land at SVG y=770, which sits on the ground
 * line drawn by HouseRowLayer at y=772.
 * Mower extends left to SVG x≈275, figure body centered at x≈430.
 * House 1 starts at x=232, so the mower reads as "in front of" the house row.
 *
 * All local coords: y=0 at feet, negative = upward.
 */
export default function ForegroundLayer({ y }: { y: MotionValue<number> | number }) {
  useReducedMotion() // consumed elsewhere; layer itself has no ambient animation

  return (
    <motion.div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        y,
        willChange: 'transform',
        pointerEvents: 'none',
        zIndex: 4,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        style={{ display: 'block' }}
      >
        <g transform="translate(430, 770)" fill={FILL}>

          {/* ── HEAD ──────────────────────────────────────── */}
          <circle cx="0" cy="-182" r="20" />

          {/* ── BODY (torso + hips, leaning ~9° toward mower) ── */}
          <rect
            x="-13" y="-162" width="26" height="74"
            rx="6"
            transform="rotate(-9 0 -125)"
          />

          {/* ── ARM (reaches forward-left to mower grip) ──── */}
          <polygon points="-9,-148 1,-148 -79,-105 -88,-110" />

          {/* ── FRONT LEG (slight forward step) ───────────── */}
          <polygon points="-6,-88 7,-88 14,0 1,0" />

          {/* ── BACK LEG (slight rearward step) ───────────── */}
          <polygon points="-9,-88 4,-88 -13,0 -26,0" />

          {/* ── MOWER HANDLE (angled rod from grip to mower body) ── */}
          <polygon points="-94,-114 -85,-114 -75,-56 -84,-56" />

          {/* ── MOWER CROSSBAR GRIP ────────────────────────── */}
          <rect x="-102" y="-117" width="24" height="9" rx="4" />

          {/* ── MOWER ENGINE BUMP (top of deck) ───────────── */}
          <rect x="-148" y="-76" width="50" height="25" rx="5" />

          {/* ── MOWER DECK (main body) ─────────────────────── */}
          <rect x="-162" y="-54" width="98" height="27" rx="7" />

          {/* ── FRONT WHEEL ────────────────────────────────── */}
          <circle cx="-146" cy="-16" r="17" />
          <circle cx="-146" cy="-16" r="8" fill="#0C0D16" opacity="0.6" />

          {/* ── REAR WHEEL ─────────────────────────────────── */}
          <circle cx="-68" cy="-16" r="17" />
          <circle cx="-68" cy="-16" r="8" fill="#0C0D16" opacity="0.6" />

        </g>
      </svg>
    </motion.div>
  )
}
