import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { updateExplosion, isExplosionExpired } from './Explosion'
import { Explosion } from '../../game/types'

export const ExplosionField = () => {
  const [explosions, setExplosions] = useState<Explosion[]>([])
  const explosionRef = useRef<THREE.Group>(null!)
  
  // Listen for explosion events from game store
  useFrame((state) => {
    const now = Date.now()
    
    // Get current explosions from store
    const storeExplosions = useGameStore.getState().state.explosions || []
    
    // Update explosions
    const updatedExplosions = storeExplosions
      .map(exp => updateExplosion(exp, state.clock.getDelta()))
      .filter(exp => !isExplosionExpired(exp, now))
    
    // Update state
    if (updatedExplosions.length !== explosions.length) {
      setExplosions(updatedExplosions)
    }
  })
  
  return (
    <group ref={explosionRef}>
      {explosions.map(explosion => (
        <ExplosionParticles key={explosion.id} explosion={explosion} />
      ))}
    </group>
  )
}

interface ExplosionParticlesProps {
  explosion: Explosion
}

const ExplosionParticles = ({ explosion }: ExplosionParticlesProps) => {
  const particleRef = useRef<THREE.Points>(null!)
  
  // Calculate alpha based on remaining lifetime
  const now = Date.now()
  const age = now - explosion.createdAt
  const totalDuration = 600
  const alpha = Math.max(0, 1 - age / totalDuration)
  
  // Create particle positions and colors
  const positions = new Float32Array(explosion.particles.length * 3)
  const colors = new Float32Array(explosion.particles.length * 3)
  
  explosion.particles.forEach((particle: any, i: number) => {
    const idx = i * 3
    positions[idx] = particle.position.x
    positions[idx + 1] = particle.position.y
    positions[idx + 2] = particle.position.z
    
    // Orange/white colors for explosion
    const t = particle.lifetime / particle.maxLifetime
    // Interpolate from white to orange
    const r = 1 - t * 0.3
    const g = 1 - t
    const b = 1 - t
    
    colors[idx] = r
    colors[idx + 1] = g
    colors[idx + 2] = b
  })
  
  return (
    <points ref={particleRef} position={[explosion.position.x, explosion.position.y, explosion.position.z]}>
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
        size={0.5}
        vertexColors={true}
        transparent={true}
        opacity={alpha}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
