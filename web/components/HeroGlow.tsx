'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useReducedMotion } from 'framer-motion'

const GOLD = '#F5A623'

// ─── Light cone ───────────────────────────────────────────────────────────────
// Replaced ConeGeometry (which produced a hard seam edge visible as a vertical
// line) with a PlaneGeometry + GLSL shader. The shader draws a soft triangular
// cone shape with a radial gradient — no mesh edges are ever visible.

const coneVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const coneFrag = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    // vUv.y: 0 = bottom (horizon base), 1 = top (fades out above)
    // vUv.x: 0 = left edge, 1 = right edge
    float cx = vUv.x - 0.5;

    // Cone narrows linearly from base to tip
    float spread = (1.0 - vUv.y) * 0.44 + 0.015;
    float mask = 1.0 - smoothstep(spread * 0.45, spread, abs(cx));

    // Fade toward top and very slightly at base to blend with arc
    float heightFade = pow(1.0 - vUv.y, 0.55);
    float baseFade   = smoothstep(0.0, 0.06, vUv.y);

    float alpha = mask * heightFade * baseFade * uOpacity;
    vec3 gold = vec3(0.961, 0.651, 0.137);
    gl_FragColor = vec4(gold, alpha);
  }
`

function LightCone({ paused }: { paused: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const timeRef = useRef(0)

  const uniforms = useMemo(() => ({ uOpacity: { value: 0.55 } }), [])

  useFrame((_, delta) => {
    if (!paused) timeRef.current += delta
    if (matRef.current) {
      const breath = 0.55 + 0.22 * Math.sin((timeRef.current / 9) * Math.PI * 2 + 1.2)
      matRef.current.uniforms.uOpacity.value = breath
    }
  })

  return (
    // Centered at y=0.4 so the plane extends from y=-2.6 (horizon arc) to y=3.4
    <mesh position={[0, 0.4, -1.2]}>
      <planeGeometry args={[3.5, 6]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={coneVert}
        fragmentShader={coneFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─── Scene ───────────────────────────────────────────────────────────────────

function GlowScene({ paused }: { paused: boolean }) {
  return (
    <>
      <LightCone paused={paused} />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          intensity={2.4}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

// ─── Canvas wrapper ───────────────────────────────────────────────────────────

export default function HeroGlow() {
  const prefersReduced = useReducedMotion() ?? false

  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 7], fov: 50 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <GlowScene paused={prefersReduced} />
    </Canvas>
  )
}
