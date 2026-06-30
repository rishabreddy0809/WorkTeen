'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'

// ─── Handle ───────────────────────────────────────────────────────────────────

type HandlePos = 'tl' | 'tr' | 'bl' | 'br' | 'ml' | 'mr'

function Handle({ pos }: { pos: HandlePos }) {
  const base: CSSProperties = {
    position: 'absolute',
    width: 6,
    height: 6,
    background: '#F7C766',
    border: '1px solid rgba(10, 8, 4, 0.55)',
    borderRadius: 1,
    pointerEvents: 'none',
    zIndex: 2,
  }

  const offset: CSSProperties =
    pos === 'tl' ? { top: -3, left: -3 } :
    pos === 'tr' ? { top: -3, right: -3 } :
    pos === 'bl' ? { bottom: -3, left: -3 } :
    pos === 'br' ? { bottom: -3, right: -3 } :
    pos === 'ml' ? { top: '50%', left: -3, transform: 'translateY(-50%)' } :
                   { top: '50%', right: -3, transform: 'translateY(-50%)' }

  return <span aria-hidden style={{ ...base, ...offset }} />
}

// ─── SelectionPanel ───────────────────────────────────────────────────────────
// A static glossy gold panel wrapping a word in the headline.
// The only allowed motion is a very slow gradient-position drift (9 s loop)
// simulating light moving across a polished surface.

export default function SelectionPanel({ children }: { children: ReactNode }) {
  const prefersReduced = useReducedMotion() ?? false

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        padding: '10px 14px',
        verticalAlign: 'middle',
        marginRight: '0.18em',
      }}
    >
      {/* Glossy diagonal gradient panel — animates background-position only */}
      <motion.span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 5,
          border: '1.5px solid #F7C766',
          backgroundImage:
            'linear-gradient(135deg, #6b4410 0%, #8a5a14 20%, #c47f1a 38%, #F5A623 50%, #c47f1a 62%, #8a5a14 80%, #6b4410 100%)',
          backgroundSize: '300% 300%',
          zIndex: 0,
        }}
        // Reduced-motion: freeze at a midpoint where the streak is visible but centred
        animate={
          prefersReduced
            ? { backgroundPosition: '60% 60%' }
            : { backgroundPosition: ['15% 15%', '85% 85%', '15% 15%'] }
        }
        transition={
          prefersReduced
            ? {}
            : {
                duration: 9,
                ease: 'easeInOut',
                repeat: Infinity,
                repeatType: 'loop',
              }
        }
      />

      {/* Six selection handles — four corners + left/right midpoints */}
      <Handle pos="tl" />
      <Handle pos="tr" />
      <Handle pos="bl" />
      <Handle pos="br" />
      <Handle pos="ml" />
      <Handle pos="mr" />

      {/* Word text — warm white for legibility over the dark-gold gradient */}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          color: '#F2EFE8',
          textShadow: '0 1px 8px rgba(10,8,4,0.35)',
        }}
      >
        {children}
      </span>
    </span>
  )
}
