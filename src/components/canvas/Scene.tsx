import { Stars } from '@react-three/drei'
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
import { LockReticle } from './LockReticle'
import { Planets } from './Planets'
import { EnemyField } from './EnemyField'
import { EnemyBulletField } from './EnemyBulletField'
import { MonitorFeeds } from './MonitorFeeds'

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
      {/* Space lighting. Directional lights are position-independent, so
          asteroids stay lit no matter how far the ship travels from origin. */}
      <ambientLight intensity={0.45} />
      {/* Primary "sun" */}
      <directionalLight position={[100, 120, 60]} intensity={1.3} color="#ffffff" />
      {/* Cool rim fill from the opposite side */}
      <directionalLight position={[-120, -60, -100]} intensity={0.5} color="#88aaff" />
      <Planets />
      <Ship />
      <AsteroidField />
      <EnemyField />
      <EnemyBulletField />
      <LaserField />
      <ShieldBubble />
      <ExplosionField />
      <ThrustParticles />
      <LockReticle />
      <Effects />
      {/* Live camera feeds for dashboard monitors */}
      <MonitorFeeds />
    </>
  )
}
