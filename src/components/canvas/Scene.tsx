import { Stars } from '@react-three/drei'
import { Environment } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Ship } from './Ship'
import { AsteroidField } from './AsteroidField'
import { LaserField } from './LaserField'
import { Effects } from './Effects'
import { ShieldBubble } from './ShieldBubble'
import { ExplosionField } from './ExplosionField'
import { ThrustParticles } from './ThrustParticles'

export const Scene = () => {
  const starRef = useRef<THREE.Points>(null!)
  
  useFrame((state) => {
    if (starRef.current) {
      starRef.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })
  
  return (
    <>
      <color attach="background" args={['#000000']} />
      {/* Enhanced starfield with color saturation */}
      <Stars
        ref={starRef}
        radius={400}
        depth={50}
        count={10000}
        factor={4}
        saturation={0.2}
        fade
        speed={0.5}
      />
      <Environment preset="city" />
      {/* Ambient light for dark space feel */}
      <ambientLight intensity={0.15} />
      {/* Warm dashboard glow */}
      <pointLight position={[-0.5, -0.5, 0.5]} intensity={0.5} color="#ffaa00" />
      {/* Cool fill light */}
      <pointLight position={[0.5, 0.5, 0.5]} intensity={0.3} color="#00aaff" />
      {/* Subtle exterior rim light */}
      <directionalLight position={[0, 0, 5]} intensity={0.1} />
      <Ship />
      <AsteroidField />
      <LaserField />
      <ShieldBubble />
      <ExplosionField />
      <ThrustParticles />
      <Effects />
    </>
  )
}
