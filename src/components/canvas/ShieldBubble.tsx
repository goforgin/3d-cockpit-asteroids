import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { isShieldActive } from '../../game/shieldSystem'

export const ShieldBubble = () => {
  const shieldRef = useRef<THREE.Mesh>(null!)
  const shipPosition = useGameStore((state) => state.state.ship.position)
  const shieldActiveUntil = useGameStore((state) => state.state.ship.shieldActiveUntil)
  const now = Date.now()
  const isShieldActiveNow = isShieldActive({ shieldActiveUntil } as any, now)
  
  // Pulse animation for shield bubble
  useFrame((state) => {
    if (shieldRef.current && isShieldActiveNow) {
      const time = state.clock.elapsedTime
      // Oscillate scale between 0.95 and 1.05
      const scale = 1 + 0.05 * Math.sin(time * 5)
      shieldRef.current.scale.set(scale, scale, scale)
    }
  })
  
  // Only render when shield is active
  if (!isShieldActiveNow) {
    return null
  }
  
  return (
    <mesh ref={shieldRef} position={[shipPosition.x, shipPosition.y, shipPosition.z]}>
      <sphereGeometry args={[3, 32, 32]} />
      <meshPhysicalMaterial
        color="#00aaff"
        transparent={true}
        opacity={0.25}
        emissive="#00ffff"
        emissiveIntensity={0.8}
        wireframe={false}
        metalness={0.3}
        roughness={0.2}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
      />
    </mesh>
  )
}
