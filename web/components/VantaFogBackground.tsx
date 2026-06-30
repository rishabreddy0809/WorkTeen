'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
// @ts-ignore — vanta ships no TypeScript declarations
import FOG from 'vanta/dist/vanta.fog.min'

type VantaEffect = { destroy(): void }

/*
 * Vanta.js Fog effect, recolored to WorkTeen's gold/charcoal palette.
 * Loaded only client-side (parent uses dynamic({ ssr: false })).
 * Prefers-reduced-motion: speed=0 freezes the fog at a static mid-frame
 * rather than skipping initialization, so the background still has texture.
 */
export default function VantaFogBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const effectRef    = useRef<VantaEffect | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    effectRef.current = FOG({
      el:   containerRef.current,
      THREE,

      // ── WorkTeen palette (unchanged) ─────────────────────────────────
      highlightColor: 0xf5a623,  // full bright gold — peak of each cloud form
      midtoneColor:   0x5c3410,  // amber — mid-body of cloud forms
      lowlightColor:  0x0c0b0a,  // near-void warm dark — deep recesses
      baseColor:      0x0f0f13,  // void charcoal — dominant dark base

      // ── Shape definition tuning ───────────────────────────────────────
      // blurFactor: higher value makes the first fbm octave (large-scale
      //   features) dominate strongly, giving each cloud form a sharper,
      //   more recognisable boundary instead of blending into a uniform haze.
      blurFactor: 0.76,
      // zoom > 1 magnifies the fractal so individual cloud shapes fill more
      //   of the viewport and read as distinct forms rather than tiny texture.
      zoom:       1.3,
      speed:      prefersReduced ? 0 : 2.8,
    }) as VantaEffect

    return () => {
      effectRef.current?.destroy()
      effectRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
