import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { isExplosionExpired } from './Explosion'
import { Explosion } from '../../game/types'
import { wrapDelta } from '../../game/math'
import { PLAY_SPACE_SIZE } from '../../game/constants'

// Particles are simulated locally and written into a Three BufferGeometry.
// Do not use AdditiveBlending on large meshes, and never draw a burst on top
// of the camera — both have previously blown the composer out to a stuck
// white frame.
export const ExplosionField = () => {
  const explosions = useGameStore((s) => s.state.explosions)

  useFrame(() => {
    const store = useGameStore.getState()
    const now = Date.now()
    const list = store.state.explosions
    if (!list.length) return
    const kept = list.filter((e) => !isExplosionExpired(e, now))
    if (kept.length !== list.length) store.updateExplosions(kept)
  })

  return (
    <group name="explosions">
      {explosions.map((explosion) => (
        <ExplosionBurst key={explosion.id} explosion={explosion} />
      ))}
    </group>
  )
}

interface ParticleSim {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  max: number
}

const ExplosionBurst = ({ explosion }: { explosion: Explosion }) => {
  const groupRef = useRef<THREE.Group>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const parts = useRef<ParticleSim[]>(
    explosion.particles.map((p) => ({
      x: p.position.x,
      y: p.position.y,
      z: p.position.z,
      vx: p.velocity.x,
      vy: p.velocity.y,
      vz: p.velocity.z,
      life: p.lifetime,
      max: p.maxLifetime,
    }))
  )

  const count = explosion.particles.length
  const posArr = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const p = explosion.particles[i]
      arr[i * 3] = p.position.x
      arr[i * 3 + 1] = p.position.y
      arr[i * 3 + 2] = p.position.z
    }
    return arr
  }, [count, explosion.id])
  const colArr = useMemo(() => new Float32Array(count * 3).fill(1), [count])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new THREE.BufferAttribute(posArr, 3)
    pos.setUsage(THREE.DynamicDrawUsage)
    const col = new THREE.BufferAttribute(colArr, 3)
    col.setUsage(THREE.DynamicDrawUsage)
    geo.setAttribute('position', pos)
    geo.setAttribute('color', col)
    return geo
  }, [posArr, colArr])

  useEffect(() => () => geometry.dispose(), [geometry])

  const kind = explosion.kind ?? 'rock'
  const isSaucer = kind === 'saucer'
  const isDust = kind === 'dust'
  const isShip = kind === 'ship'
  const showCore = isSaucer || kind === 'rock'

  const baseSize = isSaucer ? 1.8 : isDust ? 1.6 : isShip ? 1.2 : 0.7

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const group = groupRef.current
    const points = pointsRef.current
    if (!group || !points) return

    const ship = useGameStore.getState().state.ship.position
    const dx = wrapDelta(explosion.position.x - ship.x, PLAY_SPACE_SIZE)
    const dy = wrapDelta(explosion.position.y - ship.y, PLAY_SPACE_SIZE)
    const dz = wrapDelta(explosion.position.z - ship.z, PLAY_SPACE_SIZE)
    group.position.set(ship.x + dx, ship.y + dy, ship.z + dz)

    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    // Inside ~10 units an additive burst covers the whole FOV and the bloom
    // pass latches the framebuffer white. Hide the GPU burst; the HUD covers
    // ship-death, and a close rock hit is already obvious.
    const tooClose = dist < 10
    group.visible = !tooClose
    if (tooClose) return

    const now = Date.now()
    const total = explosion.duration ?? 700
    const age = Math.max(0, now - explosion.createdAt)
    const alpha = Math.max(0, 1 - age / total)

    const posAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute | undefined
    const colAttr = points.geometry.getAttribute('color') as THREE.BufferAttribute | undefined
    if (!posAttr || !colAttr) return

    const mat = points.material as THREE.PointsMaterial
    const distFade = Math.min(1, dist / 18)
    mat.opacity = (isDust ? Math.min(0.9, alpha) : Math.min(0.85, alpha)) * distFade
    mat.size = baseSize * (0.55 + 0.45 * distFade)

    const sim = parts.current
    for (let i = 0; i < sim.length; i++) {
      const p = sim[i]
      p.life += dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt
      const t = Math.min(1, p.life / p.max)
      const idx = i * 3
      posArr[idx] = p.x
      posArr[idx + 1] = p.y
      posArr[idx + 2] = p.z

      if (isSaucer) {
        colArr[idx] = 1
        colArr[idx + 1] = 0.55 - t * 0.25
        colArr[idx + 2] = 0.15
      } else if (isDust) {
        const shade = 0.45 + (1 - t) * 0.25
        colArr[idx] = shade * 0.9
        colArr[idx + 1] = shade * 0.75
        colArr[idx + 2] = shade * 0.5
      } else if (isShip) {
        colArr[idx] = 1
        colArr[idx + 1] = Math.max(0.15, 0.7 - t * 0.6)
        colArr[idx + 2] = 0.1
      } else {
        colArr[idx] = 0.95 - t * 0.2
        colArr[idx + 1] = 0.7 - t * 0.45
        colArr[idx + 2] = 0.35 - t * 0.3
      }
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true

    if (coreRef.current) {
      const u = Math.min(1, age / (isSaucer ? 400 : 250))
      const s = isSaucer ? 1.4 + u * 3.2 : 0.6 + u * 1.8
      coreRef.current.scale.setScalar(s)
      const fm = coreRef.current.material as THREE.MeshBasicMaterial
      fm.opacity = Math.max(0, 0.4 * (1 - age / (isSaucer ? 650 : 400))) * distFade
    }
  })

  const ship0 = useGameStore.getState().state.ship.position
  const origin: [number, number, number] = [
    ship0.x + wrapDelta(explosion.position.x - ship0.x, PLAY_SPACE_SIZE),
    ship0.y + wrapDelta(explosion.position.y - ship0.y, PLAY_SPACE_SIZE),
    ship0.z + wrapDelta(explosion.position.z - ship0.z, PLAY_SPACE_SIZE),
  ]

  return (
    <group ref={groupRef} position={origin}>
      {showCore && (
        <mesh ref={coreRef} renderOrder={2}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial
            color={isSaucer ? '#e09030' : '#c07028'}
            transparent
            opacity={0.4}
            depthWrite={false}
            // Normal blending — additive spheres + bloom = white screen.
            blending={THREE.NormalBlending}
          />
        </mesh>
      )}
      <points ref={pointsRef} geometry={geometry} renderOrder={3}>
        <pointsMaterial
          size={baseSize}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.NormalBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
