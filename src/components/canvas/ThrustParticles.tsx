import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { inputManager } from '../../game/input'
import { getForwardVector } from '../../game/shipPhysics'

interface ThrustParticle {
  position: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  lifetime: number
  maxLifetime: number
}

export const ThrustParticles = () => {
  const [particles, setParticles] = useState<ThrustParticle[]>([])
  const particleRef = useRef<THREE.Points>(null!)
  
  // Particle pool management
  const MAX_PARTICLES = 30
  
  useFrame((state) => {
    const ship = useGameStore.getState().state.ship
    
    // Check if Alt is held for thrust
    const isThrusting = inputManager.isKeyHeld('alt')
    
    if (isThrusting) {
      // Emit new particles from behind the ship (opposite the forward axis).
      const forward = getForwardVector(ship.rotation.yaw, ship.rotation.pitch)
      const rearPosition = {
        x: ship.position.x - forward.x * 1.5,
        y: ship.position.y - forward.y * 1.5,
        z: ship.position.z - forward.z * 1.5,
      }
      
      // Add new particles
      const newParticles: ThrustParticle[] = []
      for (let i = 0; i < 3; i++) {
        // Random spread around rear of ship
        const spread = 0.3
        newParticles.push({
          position: {
            x: rearPosition.x + (Math.random() - 0.5) * spread,
            y: rearPosition.y + (Math.random() - 0.5) * spread,
            z: rearPosition.z + (Math.random() - 0.5) * spread,
          },
          velocity: {
            x: forward.x * -5 + (Math.random() - 0.5) * 2,
            y: forward.y * -5 + (Math.random() - 0.5) * 2,
            z: forward.z * -5 + (Math.random() - 0.5) * 2,
          },
          lifetime: 0,
          maxLifetime: 0.3 + Math.random() * 0.2,
        })
      }
      
      setParticles(prev => {
        const allParticles = [...prev, ...newParticles]
        // Keep only recent particles
        return allParticles.slice(-MAX_PARTICLES)
      })
    }
    
    // Update existing particles
    setParticles(prev => {
      if (prev.length === 0) return prev
      
      return prev
        .map(p => ({
          ...p,
          lifetime: p.lifetime + state.clock.getDelta(),
          position: {
            x: p.position.x + p.velocity.x * state.clock.getDelta(),
            y: p.position.y + p.velocity.y * state.clock.getDelta(),
            z: p.position.z + p.velocity.z * state.clock.getDelta(),
          },
        }))
        .filter(p => p.lifetime < p.maxLifetime)
    })
  })
  
  if (particles.length === 0) {
    return null
  }
  
  // Create particle positions and colors
  const positions = new Float32Array(particles.length * 3)
  const colors = new Float32Array(particles.length * 3)
  
  particles.forEach((particle, i) => {
    const idx = i * 3
    positions[idx] = particle.position.x
    positions[idx + 1] = particle.position.y
    positions[idx + 2] = particle.position.z
    
    // Orange/yellow colors for thrust
    const t = particle.lifetime / particle.maxLifetime
    // Interpolate from yellow to orange
    const r = 1
    const g = 1 - t * 0.5
    const b = t * 0.3
    
    colors[idx] = r
    colors[idx + 1] = g
    colors[idx + 2] = b
  })
  
  return (
    <points ref={particleRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        vertexColors={true}
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
