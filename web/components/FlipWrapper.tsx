'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'

// Timing constants — one full cycle: hold → flip → hold → flip back
const HOLD  = 2.5   // seconds to hold each face
const FLIP  = 0.7   // seconds for the rotation arc
const CYCLE = HOLD + FLIP + HOLD + FLIP  // 6.4 s

// Fractional offsets within the cycle for the keyframe `times` array
const T_HOLD1_END = HOLD / CYCLE
const T_FLIP1_END = (HOLD + FLIP) / CYCLE
const T_HOLD2_END = (HOLD + FLIP + HOLD) / CYCLE
// T_FLIP2_END = 1.0 (loop point)

// backfaceVisibility must be hidden on BOTH faces so each is only seen during
// its own half-rotation. Safari requires the -webkit- prefix.
const HIDDEN: CSSProperties = {
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden' as CSSProperties['backfaceVisibility'],
}

/*
 * FlipWrapper — wraps any children in a continuous 3D Y-axis card flip.
 *
 * Both faces render the same children:
 *   • Front face: in normal document flow, sizes the wrapper.
 *   • Back face:  position:absolute over the front, pre-rotated 180° so it
 *                 faces away on load and becomes visible when the wrapper
 *                 reaches 180°.
 *
 * The shimmer animation on SelectionPanel (or any Framer Motion child) runs
 * entirely inside each face independently and is unaffected by the flip.
 *
 * Reduced-motion: freeze at 0° (front face visible), shimmer still active.
 */
export default function FlipWrapper({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion() ?? false

  return (
    // Outer span: establishes the 3D perspective context, matches SelectionPanel's
    // verticalAlign so it sits correctly inline with the headline text.
    <span
      style={{
        display: 'inline-block',
        perspective: '1000px',
        verticalAlign: 'middle',
      }}
    >
      {/* Inner span: the element that actually rotates. transform-style:preserve-3d
          keeps both child faces in the same 3D coordinate space so backface-
          visibility works correctly. */}
      <motion.span
        style={{
          display: 'inline-block',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
        // rotateY [0→0→180→180→360] — hold, flip, hold, flip-back, loop seamlessly.
        // 360° is identical to 0° so the loop is invisible.
        animate={reduced ? { rotateY: 0 } : { rotateY: [0, 0, 180, 180, 360] }}
        transition={
          reduced
            ? {}
            : {
                duration: CYCLE,
                times: [0, T_HOLD1_END, T_FLIP1_END, T_HOLD2_END, 1],
                // 'linear' for the hold segments (no change), 'easeInOut' for the flips
                ease: ['linear', 'easeInOut', 'linear', 'easeInOut'],
                repeat: Infinity,
                repeatType: 'loop',
              }
        }
      >
        {/* ── FRONT FACE ─────────────────────────────────────────────── */}
        {/* In flow — determines the size of the motion.span wrapper */}
        <span style={{ ...HIDDEN, display: 'inline-block' }}>
          {children}
        </span>

        {/* ── BACK FACE ──────────────────────────────────────────────── */}
        {/* Absolutely overlays the front. rotateY(180deg) pre-flips it so:
            • At wrapper rotation 0°:   net = 180° → hidden (faces away)
            • At wrapper rotation 180°: net = 360° = 0° → visible (faces viewer)
            The text inside reads correctly left-to-right because the double
            180° flip cancels out the mirroring. */}
        <span
          style={{
            ...HIDDEN,
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'rotateY(180deg)',
          }}
        >
          {children}
        </span>
      </motion.span>
    </span>
  )
}
