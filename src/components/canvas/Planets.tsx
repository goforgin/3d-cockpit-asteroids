import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PlanetDef {
  offset: [number, number, number]
  radius: number
  color: string
  emissive: string
  atmosphere: string
  clouds?: string
  ring?: boolean
  moons?: number
  spin: number
}

// Distant planets act as fixed orientation landmarks. The whole group is pinned
// to the camera position each frame, so the planets never parallax or pop as
// the ship translates/wraps — they only sweep past as you rotate, which is
// exactly the directional reference we want.
const PLANETS: PlanetDef[] = [
  { offset: [-1200, 350, -1800], radius: 220, color: '#c96b3f', emissive: '#3a1a0e', atmosphere: '#ff9a5a', clouds: '#ffd9b0', moons: 1, spin: 0.03 },
  { offset: [1600, -250, -1400], radius: 300, color: '#3f6fc9', emissive: '#0e1a3a', atmosphere: '#6aa8ff', clouds: '#bfe0ff', ring: true, moons: 2, spin: 0.02 },
  { offset: [900, 620, 1700], radius: 170, color: '#4fae8b', emissive: '#0e2a1f', atmosphere: '#8affcf', clouds: '#d6fff0', spin: 0.04 },
  { offset: [-1500, -520, 1500], radius: 130, color: '#b0553f', emissive: '#2a0e0e', atmosphere: '#ff8a6a', spin: 0.05 },
]

export const Planets = () => {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(({ camera }) => {
    if (groupRef.current) groupRef.current.position.copy(camera.position)
  })

  return (
    <group ref={groupRef}>
      {PLANETS.map((p, i) => (
        <Planet key={i} def={p} />
      ))}
    </group>
  )
}

const Planet = ({ def }: { def: PlanetDef }) => {
  const bodyRef = useRef<THREE.Mesh>(null!)
  const cloudRef = useRef<THREE.Mesh>(null!)
  const moonOrbitRef = useRef<THREE.Group>(null!)

  const bodyGeo = useMemo(() => new THREE.SphereGeometry(def.radius, 64, 64), [def.radius])

  const moons = useMemo(() => {
    const out: { dist: number; r: number; color: string; phase: number; tilt: number }[] = []
    for (let i = 0; i < (def.moons ?? 0); i++) {
      out.push({
        dist: def.radius * (1.7 + i * 0.5),
        r: def.radius * (0.12 + Math.random() * 0.08),
        color: i % 2 === 0 ? '#cfd3d8' : '#9aa0a6',
        phase: Math.random() * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 0.8,
      })
    }
    return out
  }, [def.moons, def.radius])

  useFrame((_, delta) => {
    if (bodyRef.current) bodyRef.current.rotation.y += def.spin * delta
    if (cloudRef.current) cloudRef.current.rotation.y -= def.spin * 0.6 * delta
    if (moonOrbitRef.current) moonOrbitRef.current.rotation.y += def.spin * 2.5 * delta
  })

  return (
    <group position={def.offset}>
      {/* Planet body */}
      <mesh ref={bodyRef} geometry={bodyGeo}>
        <meshStandardMaterial
          color={def.color}
          emissive={new THREE.Color(def.emissive)}
          emissiveIntensity={0.4}
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* Cloud / band layer */}
      {def.clouds && (
        <mesh ref={cloudRef} scale={1.02}>
          <sphereGeometry args={[def.radius, 48, 48]} />
          <meshStandardMaterial
            color={def.clouds}
            transparent
            opacity={0.22}
            roughness={1}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Soft atmosphere shell */}
      <mesh scale={1.08}>
        <sphereGeometry args={[def.radius, 40, 40]} />
        <meshBasicMaterial
          color={def.atmosphere}
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Ring system (multiple bands) */}
      {def.ring && (
        <group rotation={[Math.PI / 2.2, 0.3, 0]}>
          {[
            { i: 1.35, o: 1.7, op: 0.4 },
            { i: 1.75, o: 2.05, op: 0.28 },
            { i: 2.1, o: 2.35, op: 0.18 },
          ].map((band, k) => (
            <mesh key={k}>
              <ringGeometry args={[def.radius * band.i, def.radius * band.o, 96]} />
              <meshBasicMaterial
                color={def.atmosphere}
                transparent
                opacity={band.op}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Moons */}
      {moons.length > 0 && (
        <group ref={moonOrbitRef}>
          {moons.map((m, i) => (
            <mesh
              key={i}
              position={[
                Math.cos(m.phase) * m.dist,
                Math.sin(m.tilt) * m.dist * 0.3,
                Math.sin(m.phase) * m.dist,
              ]}
            >
              <sphereGeometry args={[m.r, 24, 24]} />
              <meshStandardMaterial color={m.color} roughness={0.95} metalness={0.05} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}
