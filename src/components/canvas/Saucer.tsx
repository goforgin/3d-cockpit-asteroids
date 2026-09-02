import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { wrapDelta } from '../../game/math'
import { PLAY_SPACE_SIZE } from '../../game/constants'
import { SaucerType } from '../../game/types'

interface SaucerProps {
  id: string
  type: SaucerType
  position: { x: number; y: number; z: number }
  radius: number
}

// A metallic flying-saucer: flat hull disc, glowing dome, and a ring of blinking
// rim lights. Large saucers read as steel/amber; small ones are darker with an
// angry red glow.
export const Saucer = ({ type, position, radius }: SaucerProps) => {
  const groupRef = useRef<THREE.Group>(null!)

  const accent = type === 'large' ? '#ffcc44' : '#ff3838'
  const hull = type === 'large' ? '#9aa4ad' : '#5c6066'

  const rimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: accent,
        emissive: new THREE.Color(accent),
        emissiveIntensity: 2,
        toneMapped: false,
      }),
    [accent]
  )

  const rimLights = useMemo(() => {
    const n = type === 'large' ? 10 : 8
    const out: [number, number, number][] = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      out.push([Math.cos(a) * radius * 0.92, 0, Math.sin(a) * radius * 0.92])
    }
    return out
  }, [type, radius])

  useFrame((state) => {
    const g = groupRef.current
    if (!g) return

    // Slow hull spin.
    g.rotation.y += 0.012

    // Blink the rim lights.
    const pulse = 0.6 + 0.4 * Math.sin(state.clock.elapsedTime * 6)
    rimMat.emissiveIntensity = 1.2 + pulse * 1.6

    // Draw at shortest-wrap position relative to the ship (seamless torus).
    const ship = useGameStore.getState().state.ship.position
    g.position.set(
      ship.x + wrapDelta(position.x - ship.x, PLAY_SPACE_SIZE),
      ship.y + wrapDelta(position.y - ship.y, PLAY_SPACE_SIZE),
      ship.z + wrapDelta(position.z - ship.z, PLAY_SPACE_SIZE)
    )
  })

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      {/* Lower hull */}
      <mesh scale={[1, 0.32, 1]}>
        <sphereGeometry args={[radius, 24, 16]} />
        <meshStandardMaterial color={hull} metalness={0.9} roughness={0.28} />
      </mesh>

      {/* Equatorial ring / bumper */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.98, radius * 0.1, 16, 48]} />
        <meshStandardMaterial color="#2b2f33" metalness={0.85} roughness={0.35} />
      </mesh>

      {/* Panel seam rings for surface detail */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.62, radius * 0.02, 8, 40]} />
        <meshStandardMaterial color="#15181b" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.34, radius * 0.02, 8, 32]} />
        <meshStandardMaterial color="#15181b" metalness={0.7} roughness={0.5} />
      </mesh>

      {/* Lower hull pod (classic saucer under-bump) */}
      <mesh position={[0, -radius * 0.22, 0]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[radius * 0.55, 20, 14]} />
        <meshStandardMaterial color={hull} metalness={0.9} roughness={0.32} />
      </mesh>

      {/* Glowing engine ring on the underside */}
      <mesh position={[0, -radius * 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.4, radius * 0.05, 12, 32]} />
        <meshStandardMaterial
          color={accent}
          emissive={new THREE.Color(accent)}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>

      {/* Top antenna */}
      <mesh position={[0, radius * 0.55, 0]}>
        <cylinderGeometry args={[radius * 0.02, radius * 0.02, radius * 0.5, 8]} />
        <meshStandardMaterial color="#8a9299" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, radius * 0.82, 0]}>
        <sphereGeometry args={[radius * 0.07, 10, 10]} />
        <meshStandardMaterial color={accent} emissive={new THREE.Color(accent)} emissiveIntensity={2} toneMapped={false} />
      </mesh>

      {/* Cockpit dome */}
      <mesh position={[0, radius * 0.18, 0]}>
        <sphereGeometry args={[radius * 0.5, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.5}
          transparent
          opacity={0.55}
          roughness={0.1}
          metalness={0.1}
          clearcoat={1}
        />
      </mesh>

      {/* Rim lights */}
      {rimLights.map((p, i) => (
        <mesh key={i} position={p} scale={0.55} material={rimMat}>
          <sphereGeometry args={[radius * 0.12, 8, 8]} />
        </mesh>
      ))}

      {/* Belly glow */}
      <pointLight position={[0, -radius * 0.4, 0]} color={accent} intensity={1.4} distance={radius * 6} />
    </group>
  )
}
