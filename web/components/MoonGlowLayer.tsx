'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { MotionValue } from 'framer-motion'

export default function MoonGlowLayer({ y }: { y: MotionValue<number> | number }) {
  const reduced = useReducedMotion() ?? false

  return (
    <motion.div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        y,
        willChange: 'transform',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      {/* Outer diffuse glow — large, very soft */}
      <motion.div
        style={{
          position: 'absolute',
          top: '-4%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 640,
          height: 640,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(245,166,35,0.18) 0%, rgba(245,166,35,0.07) 42%, transparent 70%)',
          filter: 'blur(48px)',
        }}
        animate={reduced ? { opacity: 0.9 } : { opacity: [0.7, 1.0, 0.75, 1.0, 0.7] }}
        transition={
          reduced
            ? {}
            : { duration: 9, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' }
        }
      />

      {/* Inner tight orb — gives a bright core to the glow */}
      <motion.div
        style={{
          position: 'absolute',
          top: '2%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(245,166,35,0.22) 0%, rgba(245,166,35,0.08) 55%, transparent 100%)',
          filter: 'blur(18px)',
        }}
        animate={reduced ? { opacity: 1 } : { opacity: [0.6, 1.0, 0.65, 1.0, 0.6] }}
        transition={
          reduced
            ? {}
            : { duration: 9, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop', delay: 0.4 }
        }
      />
    </motion.div>
  )
}
