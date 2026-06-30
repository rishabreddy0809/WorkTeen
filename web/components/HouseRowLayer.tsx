'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { MotionValue } from 'framer-motion'

const WIN_GLOW_ID  = 'wt-win-glow'
const TREE_FILL    = '#1a1b27'
const FILL_DARK    = '#1C1D2A'
const FILL_DARKER  = '#161724'

function Window({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <rect x={x} y={y} width={w} height={h} rx={2}
      fill="#F5A623" opacity={0.78}
      filter={`url(#${WIN_GLOW_ID})`}
    />
  )
}

// Porch light: wide opacity swing + bigger glow spread = clearly noticeable pulse
function FlickerWindow({
  x, y, w, h, reduced,
}: { x: number; y: number; w: number; h: number; reduced: boolean }) {
  return (
    <motion.g
      animate={
        reduced
          ? { opacity: 0.85 }
          : { opacity: [0.25, 1.0, 0.38, 1.0, 0.28, 0.95, 0.25] }
      }
      transition={
        reduced
          ? {}
          : { duration: 2.6, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' }
      }
    >
      {/* Large outer glow halo */}
      <rect
        x={x - 14} y={y - 14} width={w + 28} height={h + 28}
        rx={8} fill="#F5A623" opacity={0.35}
        filter={`url(#${WIN_GLOW_ID})`}
      />
      {/* Medium glow */}
      <rect
        x={x - 6} y={y - 6} width={w + 12} height={h + 12}
        rx={5} fill="#F5A623" opacity={0.55}
        filter={`url(#${WIN_GLOW_ID})`}
      />
      {/* Window itself — bright amber-yellow core */}
      <rect x={x} y={y} width={w} height={h} rx={2}
        fill="#FFD166"
        filter={`url(#${WIN_GLOW_ID})`}
      />
    </motion.g>
  )
}

// Tree: trunk + 3 foliage clusters; top clusters sway gently
function Tree({ reduced }: { reduced: boolean }) {
  // Trunk top at y=702, bottom at y=772 (ground). Foliage above trunk top.
  // Sway pivot = trunk top = SVG (356, 702)
  return (
    <g>
      {/* Trunk */}
      <rect x="350" y="702" width="14" height="70" rx="2" fill={TREE_FILL} />

      {/* Animated foliage — rotates ±2.5° around trunk top */}
      <motion.g
        style={{ transformOrigin: '357px 702px' }}
        animate={reduced ? { rotate: 0 } : { rotate: [-2.5, 2.5, -2.5] }}
        transition={
          reduced
            ? {}
            : { duration: 4.2, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' }
        }
      >
        {/* Bottom cluster — widest */}
        <ellipse cx="357" cy="698" rx="38" ry="32" fill={TREE_FILL} />
        {/* Middle cluster */}
        <ellipse cx="357" cy="668" rx="30" ry="28" fill={TREE_FILL} />
        {/* Top cluster — narrowest, most visible when swaying */}
        <ellipse cx="357" cy="643" rx="22" ry="22" fill={TREE_FILL} />
      </motion.g>
    </g>
  )
}

export default function HouseRowLayer({ y }: { y: MotionValue<number> | number }) {
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
        zIndex: 3,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        style={{ display: 'block' }}
      >
        <defs>
          <filter id={WIN_GLOW_ID} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Ground line — ties all elements to one baseline ───────────── */}
        <rect x="0" y="772" width="1440" height="128" fill="#0d0e1a" />
        {/* Subtle lighter ground strip at the very edge for definition */}
        <rect x="0" y="770" width="1440" height="4" fill="#22243a" opacity="0.6" />

        {/* ── House 1 — tall narrow (left) ─────────────────────────────── */}
        <rect x="268" y="448" width="20" height="90" fill={FILL_DARKER} />
        <polygon points="232,535 287,452 342,535" fill={FILL_DARKER} />
        <rect x="232" y="535" width="110" height="237" rx="2" fill={FILL_DARK} />
        <rect x="272" y="718" width="28" height="54" rx="3" fill="#0f1019" />
        {/* Flicker window — porch light on house 1 */}
        <FlickerWindow x={249} y={570} w={26} h={22} reduced={reduced} />
        {/* Static window */}
        <Window x={297} y={570} w={26} h={22} />

        {/* ── Tree — between house 1 and house 2 ──────────────────────── */}
        <Tree reduced={reduced} />

        {/* ── House 2 — wide medium (center-left) ──────────────────────── */}
        <polygon points="378,570 458,498 538,570" fill={FILL_DARKER} />
        <rect x="378" y="570" width="160" height="202" rx="2" fill={FILL_DARK} />
        <rect x="444" y="714" width="32" height="58" rx="3" fill="#0f1019" />
        <Window x={398} y={608} w={32} h={28} />
        <Window x={460} y={608} w={32} h={28} />

        {/* ── House 3 — medium (center) ────────────────────────────────── */}
        <rect x="690" y="462" width="16" height="96" fill={FILL_DARKER} />
        <polygon points="600,555 668,476 736,555" fill={FILL_DARKER} />
        <rect x="600" y="555" width="136" height="217" rx="2" fill="#1a1b28" />
        <rect x="652" y="716" width="30" height="56" rx="3" fill="#0f1019" />
        <Window x={617} y={595} w={28} h={24} />
        <Window x={672} y={595} w={28} h={24} />

        {/* ── House 4 — small (right) ──────────────────────────────────── */}
        <polygon points="820,625 866,558 912,625" fill={FILL_DARKER} />
        <rect x="820" y="625" width="92" height="147" rx="2" fill="#181926" />
        <rect x="849" y="719" width="26" height="53" rx="3" fill="#0f1019" />
        <Window x={836} y={660} w={22} h={20} />
      </svg>
    </motion.div>
  )
}
