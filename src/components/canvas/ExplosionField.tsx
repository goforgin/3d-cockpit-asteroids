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

    // New game / death clears the store array — also drop the local cache or
    // a ship-death burst would keep drawing (and stay additive-white) after restart.
    if (storeExplosions.length === 0 && workingRef.current.length > 0) {
      workingRef.current = []
      seenRef.current.clear()
      force((n) => (n + 1) % 1000000)
      return
    }

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
    <group name="explosions">
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
  const isSaucer = explosion.kind === 'saucer'
  const isDust = explosion.kind === 'dust'

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
    } else if (isSaucer) {
      // Fireball + metal sparks: white/orange/amber
      colors[idx] = 1
      colors[idx + 1] = Math.max(0.2, 0.9 - t * 0.8)
      colors[idx + 2] = Math.max(0, 0.3 - t * 0.5)
    } else if (isDust) {
      // Dusty grey/tan/brown (NOT fire)
      colors[idx] = 0.5 + Math.random() * 0.3
      colors[idx + 1] = 0.4 + Math.random() * 0.2
      colors[idx + 2] = 0.3 + Math.random() * 0.2
    } else {
      // Rock shatter
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

  // Determine size and blending based on kind
  let size = 0.6
  let blending: THREE.Blending = THREE.AdditiveBlending
  if (isSaucer) {
    size = 1.1
    blending = THREE.AdditiveBlending
  } else if (isDust) {
    size = 0.28
    blending = THREE.NormalBlending
  } else if (isShip) {
    size = 1.6
    blending = THREE.AdditiveBlending
  }

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
        size={size}
        vertexColors={true}
        transparent={true}
        opacity={alpha}
        blending={blending}
        depthWrite={false}
      />
    </points>
  )
}
