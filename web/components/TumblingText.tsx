'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useReducedMotion } from 'framer-motion'

const SPEED    = (Math.PI * 2) / 7
const STATIC_X = 0.52   // ~30° resting angle — depth visible

function GoldRect({ paused }: { paused: boolean }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (paused) {
      groupRef.current.rotation.x = STATIC_X
    } else {
      groupRef.current.rotation.x += delta * SPEED
    }
  })

  return (
    // Box + text share this group so they rotate together as one unit
    <group ref={groupRef} rotation={[STATIC_X, 0, 0]}>
      {/* Gold metallic slab */}
      <mesh>
        <boxGeometry args={[6.4, 1.35, 0.34]} />
        <meshPhysicalMaterial
          color="#F5A623"
          metalness={0.88}
          roughness={0.22}
          envMapIntensity={1.4}
          clearcoat={0.25}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* "Actually" printed on the front face — spins with the box */}
      <Html
        transform
        center
        position={[0, 0, 0.23]}
        distanceFactor={3.6}
        style={{
          color: '#F2EFE8',
          fontFamily: 'var(--font-display)',
          fontSize: '122px',
          fontWeight: 700,
          lineHeight: 1,
          pointerEvents: 'none',
          textShadow: '0 2px 10px rgba(15, 15, 19, 0.26)',
          whiteSpace: 'nowrap',
        }}
      >
        Actually
      </Html>
    </group>
  )
}

export default function TumblingRect() {
  const prefersReduced = useReducedMotion() ?? false

  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3], fov: 50 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 5, 4]} intensity={2.8} color="#fff8f0" />
      <pointLight position={[-3, -2, 2]} intensity={0.75} color="#c8c0ff" />
      <pointLight position={[0.5, 1, -3]} intensity={0.5} color="#f5a623" />

      <Suspense fallback={null}>
        <GoldRect paused={prefersReduced} />
        <Environment preset="studio" background={false} />
      </Suspense>
    </Canvas>
  )
}
