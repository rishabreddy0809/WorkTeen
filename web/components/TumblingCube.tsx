'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useReducedMotion } from 'framer-motion'

// Gentle Y-axis rocking after the CSS slide-in settles
const ROCK_PERIOD    = 6.0   // seconds per full oscillation
const ROCK_AMPLITUDE = 0.22  // ±~13° so the 3D depth reads clearly

// Build the canvas texture for the front face — "Actually" in Playfair Display
// on a gold diagonal gradient, matching the SelectionPanel palette.
// Must be called after document.fonts.ready so the font is available.
function buildFaceTexture(): THREE.CanvasTexture {
  // 640×224: wide enough that "Actually" at 96px fits with comfortable margins
  const W = 640, H = 224
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!

  // Gold gradient (same stops as the old SelectionPanel shimmer)
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0,    '#6b4410')
  g.addColorStop(0.20, '#8a5a14')
  g.addColorStop(0.38, '#c47f1a')
  g.addColorStop(0.50, '#F5A623')
  g.addColorStop(0.62, '#c47f1a')
  g.addColorStop(0.80, '#8a5a14')
  g.addColorStop(1,    '#6b4410')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Warm white text in Playfair Display — same font as the rest of the headline.
  // 96px fits "Actually" within the 640px canvas with ~60px margin per side.
  ctx.font            = 'bold 96px "Playfair Display", serif'
  ctx.fillStyle       = '#F2EFE8'
  ctx.textAlign       = 'center'
  ctx.textBaseline    = 'middle'
  ctx.fillText('Actually', W / 2, H / 2)

  return new THREE.CanvasTexture(c)
}

// ─── 3D Box ─────────────────────────────────────────────────────────────────

function GoldBox({ paused }: { paused: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  // Start 15% into the cycle so there is already a visible angle on first render
  const clockRef = useRef(ROCK_PERIOD * 0.15)

  const [faceTex, setFaceTex] = useState<THREE.CanvasTexture | null>(null)

  // Load the face texture once fonts are ready
  useEffect(() => {
    let live = true
    document.fonts.ready.then(() => {
      if (!live) return
      setFaceTex(buildFaceTexture())
    })
    return () => { live = false }
  }, [])

  // Gold material shared across side faces
  const goldMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0xF5A623,
    metalness: 0.88,
    roughness: 0.22,
    envMapIntensity: 1.6,
  }), [])

  // Front face material — starts gold, gets the texture when it loads
  const faceMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0xF5A623,
    metalness: 0.88,
    roughness: 0.22,
    envMapIntensity: 1.0,
  }), [])

  // Update face material imperatively when texture arrives
  useEffect(() => {
    if (!faceTex) return
    faceMat.map          = faceTex
    faceMat.color.set(0xffffff)
    faceMat.metalness    = 0.25
    faceMat.roughness    = 0.42
    faceMat.needsUpdate  = true
  }, [faceTex, faceMat])

  // Material order for BoxGeometry: [+X, -X, +Y, -Y, +Z front, -Z back]
  // Camera is at positive Z, so face index 4 (+Z) faces the viewer.
  const materials = useMemo(
    () => [goldMat, goldMat, goldMat, goldMat, faceMat, goldMat],
    [goldMat, faceMat],
  )

  useFrame((_, delta) => {
    if (!groupRef.current) return

    if (paused) {
      // Frozen at a slight angle so the 3D depth is still evident
      groupRef.current.rotation.y = 0.18
      return
    }

    // Gentle rocking: sin wave so "Actually" stays legible the whole time
    clockRef.current += delta
    groupRef.current.rotation.y =
      Math.sin((clockRef.current * Math.PI * 2) / ROCK_PERIOD) * ROCK_AMPLITUDE
  })

  return (
    <group ref={groupRef}>
      <mesh material={materials}>
        {/* Wide sign shape: W × H × depth */}
        <boxGeometry args={[2.85, 1.0, 0.38]} />
      </mesh>
    </group>
  )
}

// ─── Exported canvas component ───────────────────────────────────────────────

export default function TumblingCube() {
  const paused = useReducedMotion() ?? false

  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      // Camera pulled back far enough to frame the 2.85-wide box with a bit of air
      camera={{ position: [0, 0, 1.55], fov: 42 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      {/* Warm ambient so the shadowed faces aren't black */}
      <ambientLight intensity={0.38} color="#fff4e0" />
      {/* Key light from upper-left — sweeps a moving highlight across faces */}
      <directionalLight position={[-3.5, 5, 4]} intensity={2.6} color="#fff8f0" />
      {/* Warm fill from lower-right */}
      <pointLight position={[3, -2, 2]} intensity={0.85} color="#f5a623" />
      {/* Cool rim from behind — edges separate from dark background */}
      <pointLight position={[0, 1.5, -3]} intensity={0.4} color="#b8b0ff" />

      <GoldBox paused={paused} />

      {/* IBL for realistic metalness on the gold sides */}
      <Suspense fallback={null}>
        <Environment preset="studio" background={false} />
      </Suspense>
    </Canvas>
  )
}
