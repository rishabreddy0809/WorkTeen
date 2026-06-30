'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from 'framer-motion'

// Camera position=[0,0,7] fov=50 → visible at z≈-2: X≈±7.5, Y≈±4.2
// Three organic strands sweep freely across the full viewport.
// Text content sits at CSS z-10 so it always renders above the canvas.

interface RibbonDef {
  points: [number, number, number][]
  speed:      number
  delay:      number
  opacity:    number
  tubeRadius: number
}

const RIBBONS: RibbonDef[] = [
  {
    // Strand A — rises from bottom-left, dips through center, exits upper-right
    points: [
      [-7.5, -3.8, -2.2],
      [-4.0, -1.2, -2.2],
      [-1.5, -3.2, -2.2],
      [ 1.0,  0.4, -2.2],
      [ 3.5,  2.8, -2.2],
      [ 6.5,  1.2, -2.2],
      [ 8.0,  3.5, -2.2],
    ],
    speed: 0.20, delay: 0.0, opacity: 0.20, tubeRadius: 0.018,
  },
  {
    // Strand B — wide amplitude undulation, different depth
    points: [
      [-7.5,  2.2, -2.8],
      [-4.0, -2.8, -2.8],
      [-1.0,  1.5, -2.8],
      [ 1.5, -1.0, -2.8],
      [ 4.0,  2.5, -2.8],
      [ 7.0, -0.5, -2.8],
      [ 8.0,  1.0, -2.8],
    ],
    speed: 0.14, delay: 1.6, opacity: 0.16, tubeRadius: 0.015,
  },
  {
    // Strand C — high-left descent with strong wave, closest to camera
    points: [
      [-7.5,  3.5, -1.8],
      [-4.0, -0.8, -1.8],
      [-1.0, -3.5, -1.8],
      [ 1.5, -1.5, -1.8],
      [ 4.0,  1.8, -1.8],
      [ 7.0, -2.0, -1.8],
      [ 8.0, -0.5, -1.8],
    ],
    speed: 0.25, delay: 3.0, opacity: 0.22, tubeRadius: 0.021,
  },
]

// ─── Shader ───────────────────────────────────────────────────────────────────
// Traveling highlight pulse sweeping left→right along each strand.

const ribbonVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ribbonFrag = /* glsl */ `
  uniform float uHighlightOffset;
  uniform float uBaseOpacity;
  varying vec2  vUv;

  void main() {
    float u     = vUv.x;
    float dist  = abs(mod(u - uHighlightOffset + 0.5, 1.0) - 0.5);
    float pulse = exp(-dist * dist * 200.0);

    float baseA  = uBaseOpacity;
    float pulseA = pulse * 0.45;
    vec3  gold   = vec3(0.961, 0.651, 0.137);

    gl_FragColor = vec4(gold * (baseA + pulse * 1.5), baseA + pulseA);
  }
`

// ─── Single ribbon ────────────────────────────────────────────────────────────

function Ribbon({ def, paused }: { def: RibbonDef; paused: boolean }) {
  const matRef  = useRef<THREE.ShaderMaterial>(null)
  const timeRef = useRef(def.delay)

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      def.points.map(([x, y, z]) => new THREE.Vector3(x, y, z))
    )
    return new THREE.TubeGeometry(curve, 180, def.tubeRadius, 8, false)
  }, [def.points, def.tubeRadius])

  const uniforms = useMemo(() => ({
    uHighlightOffset: { value: (def.delay * def.speed) % 1 },
    uBaseOpacity:     { value: def.opacity },
  }), [def.delay, def.speed, def.opacity])

  useFrame((_, delta) => {
    if (!paused) timeRef.current += delta
    if (matRef.current) {
      matRef.current.uniforms.uHighlightOffset.value =
        (timeRef.current * def.speed) % 1
    }
  })

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        vertexShader={ribbonVert}
        fragmentShader={ribbonFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─── Canvas wrapper ───────────────────────────────────────────────────────────

export default function FlowingRibbons() {
  const prefersReduced = useReducedMotion() ?? false

  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 7], fov: 50 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      {RIBBONS.map((def, i) => (
        <Ribbon key={i} def={def} paused={prefersReduced} />
      ))}
    </Canvas>
  )
}
