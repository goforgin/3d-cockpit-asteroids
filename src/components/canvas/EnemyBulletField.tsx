import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { wrapDelta } from '../../game/math'
import { PLAY_SPACE_SIZE } from '../../game/constants'
import { EnemyBullet } from '../../game/types'

// Renders enemy bullets as glowing plasma orbs. Small-saucer rounds glow hotter
// red; large-saucer rounds are amber. Positions are drawn at the shortest-wrap
// offset from the ship to match the toroidal world.
export const EnemyBulletField = () => {
  const bullets = useGameStore((state) => state.state.enemyBullets)

  return (
    <>
      {bullets.map((b) => (
        <Bolt key={b.id} bullet={b} />
      ))}
    </>
  )
}

const Bolt = ({ bullet }: { bullet: EnemyBullet }) => {
  const ref = useRef<THREE.Group>(null!)
  const color = bullet.fromSmall ? '#ff4030' : '#ffb020'

  useFrame(() => {
    const g = ref.current
    if (!g) return
    const ship = useGameStore.getState().state.ship.position
    g.position.set(
      ship.x + wrapDelta(bullet.position.x - ship.x, PLAY_SPACE_SIZE),
      ship.y + wrapDelta(bullet.position.y - ship.y, PLAY_SPACE_SIZE),
      ship.z + wrapDelta(bullet.position.z - ship.z, PLAY_SPACE_SIZE)
    )
  })

  return (
    <group ref={ref} position={[bullet.position.x, bullet.position.y, bullet.position.z]}>
      <mesh>
        <sphereGeometry args={[0.8, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} toneMapped={false} />
      </mesh>
      {/* soft glow halo */}
      <mesh>
        <sphereGeometry args={[1.5, 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight color={color} intensity={1.2} distance={10} />
    </group>
  )
}
