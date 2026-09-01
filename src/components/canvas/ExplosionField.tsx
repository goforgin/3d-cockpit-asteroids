import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { updateExplosion, isExplosionExpired } from './Explosion'
import { Explosion } from '../../game/types'
import { wrapDelta } from '../../game/math'
import { PLAY_SPACE_SIZE } from '../../game/constants'

export const ExplosionField = () => {
  // Working copy of active explosions with locally-advancing particles.
  const workingRef = useRef<Explosion[]>([])
  const seenRef = useRef<Set<string>>(new Set())
  const [, force] = useState(0)

  useFrame((_, delta) => {
    const now = Date.now()
    const store = useGameStore.getState()
    const storeExplosions = store.state.explosions || []

    // Seed newly-spawned explosions into the working set once.
    for (const e of storeExplosions) {
      if (!seenRef.current.has(e.id)) {
        seenRef.current.add(e.id)
        workingRef.current.push({
          ...e,
          particles: e.particles.map((p) => ({ ...p, position: { ...p.position } })),
        })
      }
    }

    const hadAny = workingRef.current.length > 0

    // Advance + cull.
    workingRef.current = workingRef.current
      .map((e) => updateExplosion(e, delta))
      .filter((e) => !isExplosionExpired(e, now))

    // Prune finished explosions out of the store so it never grows unbounded.
    const alive = new Set(workingRef.current.map((e) => e.id))
    const pruned = storeExplosions.filter(
      (e) => !seenRef.current.has(e.id) || alive.has(e.id)
    )
    if (pruned.length !== storeExplosions.length) {
      store.updateExplosions(pruned)
    }
    if (workingRef.current.length === 0 && pruned.length === 0) {
      seenRef.current.clear()
    }

    if (hadAny || workingRef.current.length > 0) force((n) => (n + 1) % 1000000)
  })

  return (
    <group>
      {workingRef.current.map((explosion) => (
        <ExplosionParticles key={explosion.id} explosion={explosion} />
      ))}
    </group>
  )
}

interface ExplosionParticlesProps {
  explosion: Explosion
}

const ExplosionParticles = ({ explosion }: ExplosionParticlesProps) => {
  const now = Date.now()
  const age = now - explosion.createdAt
  const total = explosion.duration ?? 600
  const alpha = Math.max(0, 1 - age / total)
  const isShip = explosion.kind === 'ship'

  const count = explosion.particles.length
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  explosion.particles.forEach((particle, i) => {
    const idx = i * 3
    positions[idx] = particle.position.x
    positions[idx + 1] = particle.position.y
    positions[idx + 2] = particle.position.z

    const t = Math.min(1, particle.lifetime / particle.maxLifetime)
    if (isShip) {
      // White-hot core -> orange -> deep red as the debris cools.
      colors[idx] = 1
      colors[idx + 1] = Math.max(0.1, 0.9 - t * 0.9)
      colors[idx + 2] = Math.max(0, 0.4 - t * 0.6)
    } else {
      colors[idx] = 1 - t * 0.2
      colors[idx + 1] = 1 - t * 0.7
      colors[idx + 2] = 1 - t
    }
  })

  // Anchor the burst at the ship-relative (wrapped) position so it lines up with
  // the toroidal rendering of the rest of the world.
  const ship = useGameStore.getState().state.ship.position
  const cx = ship.x + wrapDelta(explosion.position.x - ship.x, PLAY_SPACE_SIZE)
  const cy = ship.y + wrapDelta(explosion.position.y - ship.y, PLAY_SPACE_SIZE)
  const cz = ship.z + wrapDelta(explosion.position.z - ship.z, PLAY_SPACE_SIZE)

  return (
    <points position={[cx, cy, cz]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={isShip ? 1.6 : 0.6}
        vertexColors={true}
        transparent={true}
        opacity={alpha}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
