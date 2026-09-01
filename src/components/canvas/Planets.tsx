import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PlanetDef {
  offset: [number, number, number]
  radius: number
  color: string
  emissive: string
  atmosphere: string
  ring?: boolean
  spin: number
}

// Distant planets act as fixed orientation landmarks. The whole group is pinned
// to the camera position each frame, so the planets never parallax or pop as
// the ship translates/wraps — they only sweep past as you rotate, which is
// exactly the directional reference we want.
const PLANETS: PlanetDef[] = [
  { offset: [-1200, 350, -1800], radius: 220, color: '#c96b3f', emissive: '#3a1a0e', atmosphere: '#ff9a5a', spin: 0.01 },
  { offset: [1600, -250, -1400], radius: 300, color: '#3f6fc9', emissive: '#0e1a3a', atmosphere: '#6aa8ff', ring: true, spin: 0.006 },
  { offset: [900, 600, 1700], radius: 160, color: '#4fae8b', emissive: '#0e2a1f', atmosphere: '#8affcf', spin: 0.014 },
  { offset: [-1500, -500, 1500], radius: 120, color: '#b0553f', emissive: '#2a0e0e', atmosphere: '#ff8a6a', spin: 0.02 },
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

  const geo = useMemo(() => new THREE.SphereGeometry(def.radius, 48, 48), [def.radius])

  useFrame((_, delta) => {
    if (bodyRef.current) bodyRef.current.rotation.y += def.spin * delta
  })

  return (
    <group position={def.offset}>
      {/* Planet body */}
      <mesh ref={bodyRef} geometry={geo}>
        <meshStandardMaterial
          color={def.color}
          emissive={new THREE.Color(def.emissive)}
          emissiveIntensity={0.35}
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {/* Soft atmosphere shell */}
      <mesh scale={1.06}>
        <sphereGeometry args={[def.radius, 32, 32]} />
        <meshBasicMaterial
          color={def.atmosphere}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Optional ring system */}
      {def.ring && (
        <mesh rotation={[Math.PI / 2.2, 0.3, 0]}>
          <ringGeometry args={[def.radius * 1.4, def.radius * 2.2, 64]} />
          <meshBasicMaterial
            color={def.atmosphere}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
