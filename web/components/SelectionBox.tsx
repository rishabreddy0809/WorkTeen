'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'

// ─── Corner handle ────────────────────────────────────────────────────────────

type Corner = 'tl' | 'tr' | 'bl' | 'br'

function Handle({ corner }: { corner: Corner }) {
  const style: CSSProperties = {
    position: 'absolute',
    width: 6,
    height: 6,
    background: '#F5A623',
    borderRadius: 1,
    pointerEvents: 'none',
    top:    corner.startsWith('t') ? -3 : undefined,
    bottom: corner.startsWith('b') ? -3 : undefined,
    left:   corner.endsWith('l')   ? -3 : undefined,
    right:  corner.endsWith('r')   ? -3 : undefined,
  }
  return <span aria-hidden style={style} />
}

// ─── Single card face ─────────────────────────────────────────────────────────
// Renders the gold border, corner handles, and child text.
// `back` flips it 180° on Y and positions it absolute so it occupies the same
// space as the front face. backfaceVisibility:hidden ensures each face is only
// visible during its own half of the rotation.

function Face({
  children,
  back,
}: {
  children: ReactNode
  back?: boolean
}) {
  const faceStyle: CSSProperties = {
    display: back ? 'flex' : 'inline-flex',
    alignItems: 'center',
    justifyContent: back ? 'center' : undefined,
    padding: '6px 8px',
    // back face: absolute so it sits on top of front face without adding width
    position: back ? 'absolute' : 'relative',
    inset: back ? 0 : undefined,
    // Pre-rotate back face 180° — when the flip reaches 180° this face reads
    // right-to-left from the back perspective but left-to-right to the viewer
    transform: back ? 'rotateY(180deg)' : undefined,
    backfaceVisibility: 'hidden',
    // Safari vendor prefix
    WebkitBackfaceVisibility: 'hidden' as CSSProperties['backfaceVisibility'],
  }

  return (
    <span style={faceStyle}>
      {/* Gold border + inner fill */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          border: '1.5px solid #F5A623',
          borderRadius: 4,
          background: 'rgba(245, 166, 35, 0.05)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          pointerEvents: 'none',
        }}
      />
      {/* Corner handles */}
      <Handle corner="tl" />
      <Handle corner="tr" />
      <Handle corner="bl" />
      <Handle corner="br" />
      {/* Text (positioned above the absolute border overlay) */}
      <span style={{ position: 'relative' }}>{children}</span>
    </span>
  )
}

// ─── SelectionBox ─────────────────────────────────────────────────────────────
// Flip cycle: hold 2.4s → flip 0.7s → hold 2.4s → flip back 0.7s = 6.2s total
// rotateY keyframes: [0, 0, 180, 180, 360]
//   0→0   : hold at front (2.4s)
//   0→180 : flip to back  (0.7s, easeInOut)
//   180→180: hold at back  (2.4s)
//   180→360: flip to front (0.7s, easeInOut) — 360 == 0, loop seamlessly

const HOLD = 2.4
const FLIP = 0.7
const CYCLE = HOLD + FLIP + HOLD + FLIP  // 6.2s

const t0 = 0
const t1 = HOLD / CYCLE               // end of first hold
const t2 = (HOLD + FLIP) / CYCLE      // end of first flip
const t3 = (HOLD + FLIP + HOLD) / CYCLE  // end of second hold
const t4 = 1

export default function SelectionBox({ children }: { children: ReactNode }) {
  const prefersReduced = useReducedMotion() ?? false

  return (
    /*
     * Outer span: sets the CSS perspective so the 3D flip has depth.
     * display:inline-block so it sits inline with the surrounding headline text.
     * marginRight adds a small visual gap between the box border and "hired."
     */
    <span
      style={{
        display: 'inline-block',
        perspective: '900px',
        marginRight: '0.22em',
      }}
    >
      {/*
       * Flipping unit: transformStyle:preserve-3d so child faces exist in the
       * same 3D space. position:relative so the absolute back face is contained.
       * rotateY goes 0→360 over the cycle; at 180° the back face is visible.
       */}
      <motion.span
        style={{
          display: 'inline-block',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
        animate={
          prefersReduced
            ? {}
            : { rotateY: [0, 0, 180, 180, 360] }
        }
        transition={
          prefersReduced
            ? {}
            : {
                duration: CYCLE,
                times: [t0, t1, t2, t3, t4],
                ease: ['linear', 'easeInOut', 'linear', 'easeInOut'],
                repeat: Infinity,
              }
        }
      >
        <Face>{children}</Face>
        <Face back>{children}</Face>
      </motion.span>
    </span>
  )
}
