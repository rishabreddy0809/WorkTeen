'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useReducedMotion } from 'framer-motion'

// ─── Ring material props ──────────────────────────────────────────────────────
// High metalness requires an environment map to look right (otherwise appears
// near-black). The <Environment> below provides IBL; the directional lights
// create the moving highlight sweep as the rings rotate.

const GOLD = '#F5A623'

// ─── Individual ring mesh ─────────────────────────────────────────────────────

function Ring({
  radius,
  tube,
  initialRotation,
  speedX = 0,
  speedY = 0,
  speedZ = 0,
  paused,
}: {
  radius: number
  tube: number
  initialRotation: [number, number, number]
  speedX?: number
  speedY?: number
  speedZ?: number
  paused: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (paused || !ref.current) return
    ref.current.rotation.x += speedX * delta
    ref.current.rotation.y += speedY * delta
    ref.current.rotation.z += speedZ * delta
  })

  return (
    <mesh ref={ref} rotation={initialRotation}>
      {/* 22 radial segs = smooth tube circle, 120 tubular segs = smooth ring curve */}
      <torusGeometry args={[radius, tube, 22, 120]} />
      <meshPhysicalMaterial
        color={GOLD}
        metalness={0.92}
        roughness={0.28}
        envMapIntensity={1.5}
        clearcoat={0.25}
        clearcoatRoughness={0.15}
      />
    </mesh>
  )
}

// ─── Three-ring gimbal group ──────────────────────────────────────────────────

function GimbalRings({ paused }: { paused: boolean }) {
  return (
    // Scale + z-push moves it slightly back so it reads as background
    <group scale={0.88} position={[0, 0, -0.5]}>
      {/* Outer ring — tilted on both X and Y so it reads as a 3D hoop,
          rotates slowly around X */}
      <Ring
        radius={2.2}
        tube={0.07}
        initialRotation={[0.4, 0.65, 0.1]}
        speedX={0.28}
        paused={paused}
      />

      {/* Middle ring — clearly in a different plane from outer ring,
          rotates the opposite way around Y */}
      <Ring
        radius={1.6}
        tube={0.07}
        initialRotation={[Math.PI / 4, 0.25, Math.PI / 5]}
        speedY={-0.19}
        paused={paused}
      />

      {/* Inner ring — third distinct plane, rotates around Z */}
      <Ring
        radius={1.1}
        tube={0.065}
        initialRotation={[0.15, Math.PI / 3, Math.PI / 4]}
        speedZ={0.14}
        paused={paused}
      />
    </group>
  )
}

// ─── Canvas wrapper (default export) ─────────────────────────────────────────

export default function GimbalBackground() {
  const prefersReduced = useReducedMotion() ?? false

  return (
    <Canvas
      // alpha:true keeps the canvas background fully transparent so the
      // #0F0F13 site background and any grain texture show through
      gl={{ alpha: true, antialias: true }}
      // Cap pixel ratio so high-DPI screens don't kill performance
      dpr={[1, 2]}
      camera={{ position: [0, 0, 7], fov: 45 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      {/* Soft base fill — keeps shadowed faces from going pure black */}
      <ambientLight intensity={0.22} />

      {/* Key light — warm white from upper right, creates the sweeping
          highlight that sells the "real brushed metal" look as rings turn */}
      <directionalLight
        position={[5, 5, 3]}
        intensity={2.6}
        color="#fff6e8"
      />

      {/* Fill light — cool from lower left, adds depth and subtle blue-purple
          contrast that pops against the gold */}
      <directionalLight
        position={[-4, -3, 2]}
        intensity={0.55}
        color="#c8c0ff"
      />

      {/* Rim light — low-intensity gold point from behind the rings,
          creates a faint halo on the back edges as they rotate */}
      <pointLight
        position={[0.5, -1, -5]}
        intensity={0.9}
        color="#f5a623"
      />

      <GimbalRings paused={prefersReduced} />

      {/* Image-based lighting — gives metalness the environment reflections
          it needs to not look black; background:false keeps canvas transparent */}
      <Suspense fallback={null}>
        <Environment preset="studio" background={false} />
      </Suspense>
    </Canvas>
  )
}
