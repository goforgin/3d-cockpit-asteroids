import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { isExplosionExpired } from './Explosion'
import { Explosion, ExplosionParticle } from '../../game/types'
import { wrapDelta } from '../../game/math'
import { PLAY_SPACE_SIZE } from '../../game/constants'
import { getGlowTexture, getSmokeTexture } from './particleTextures'

// Camera-facing quads with soft circular/cloud textures. THREE.Points without
// a map are hardware squares and clamp to a few pixels at range, which is
// why bursts used to look like Lego studs.

const _dummy = new THREE.Object3D()
const _camLocal = new THREE.Vector3()

const billboardVert = /* glsl */ `
  attribute vec3 aColor;
  attribute float aOpacity;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    vUv = uv;
    vColor = aColor;
    vOpacity = aOpacity;
    #ifdef USE_INSTANCING
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    #else
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    #endif
    gl_Position = projectionMatrix * mvPosition;
  }
`

const billboardFrag = /* glsl */ `
  uniform sampler2D uMap;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    vec4 texel = texture2D(uMap, vUv);
    float a = texel.a * vOpacity;
    if (a < 0.02) discard;
    gl_FragColor = vec4(vColor * texel.r, a);
  }
`

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

interface Sim {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  max: number
  size: number
  grow: number
  drag: number
  angle: number
  spin: number
  layer: 'spark' | 'puff'
}

const toSim = (p: ExplosionParticle): Sim => ({
  x: p.position.x,
  y: p.position.y,
  z: p.position.z,
  vx: p.velocity.x,
  vy: p.velocity.y,
  vz: p.velocity.z,
  life: p.lifetime,
  max: p.maxLifetime,
  size: p.size,
  grow: p.grow,
  drag: p.drag,
  angle: Math.random() * Math.PI * 2,
  spin: p.spin,
  layer: p.layer ?? 'puff',
})

const ExplosionBurst = ({ explosion }: { explosion: Explosion }) => {
  const groupRef = useRef<THREE.Group>(null)
  const flashRef = useRef<THREE.Sprite>(null)
  const all = useRef<Sim[]>(explosion.particles.map(toSim))
  const kind = explosion.kind ?? 'rock'
  const isSaucer = kind === 'saucer'
  const isDust = kind === 'dust'
  const showFlash = !isDust

  const sparks = useMemo(() => all.current.filter((p) => p.layer === 'spark'), [])
  const puffs = useMemo(() => all.current.filter((p) => p.layer === 'puff'), [])

  const ship0 = useGameStore.getState().state.ship.position
  const origin: [number, number, number] = [
    ship0.x + wrapDelta(explosion.position.x - ship0.x, PLAY_SPACE_SIZE),
    ship0.y + wrapDelta(explosion.position.y - ship0.y, PLAY_SPACE_SIZE),
    ship0.z + wrapDelta(explosion.position.z - ship0.z, PLAY_SPACE_SIZE),
  ]

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    const ship = useGameStore.getState().state.ship.position
    const dx = wrapDelta(explosion.position.x - ship.x, PLAY_SPACE_SIZE)
    const dy = wrapDelta(explosion.position.y - ship.y, PLAY_SPACE_SIZE)
    const dz = wrapDelta(explosion.position.z - ship.z, PLAY_SPACE_SIZE)
    group.position.set(ship.x + dx, ship.y + dy, ship.z + dz)

    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const proximity = THREE.MathUtils.clamp((dist - 4) / 10, 0, 1)
    group.visible = dist > 3
    if (dist <= 3) return

    const now = Date.now()
    const age = Math.max(0, now - explosion.createdAt)
    const flashT = Math.min(1, age / (isSaucer ? 280 : 180))

    if (flashRef.current) {
      const s = (isSaucer ? 2.2 : 1.4) + flashT * (isSaucer ? 3.4 : 2.2)
      flashRef.current.scale.setScalar(s)
      const mat = flashRef.current.material as THREE.SpriteMaterial
      mat.opacity = Math.max(0, 0.55 * (1 - age / (isSaucer ? 420 : 320))) * proximity
    }
  })

  return (
    <group ref={groupRef} position={origin}>
      {showFlash && (
        <sprite ref={flashRef} scale={1.4} renderOrder={1}>
          <spriteMaterial
            map={getGlowTexture()}
            color={isSaucer ? '#ffb040' : '#e08030'}
            transparent
            opacity={0.5}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </sprite>
      )}
      {sparks.length > 0 && (
        <BillboardCloud
          sim={sparks}
          explosion={explosion}
          kind={kind}
          layer="spark"
          map={getGlowTexture()}
          additive
        />
      )}
      {puffs.length > 0 && (
        <BillboardCloud
          sim={puffs}
          explosion={explosion}
          kind={kind}
          layer="puff"
          map={getSmokeTexture()}
          additive={false}
        />
      )}
    </group>
  )
}

interface CloudProps {
  sim: Sim[]
  explosion: Explosion
  kind: string
  layer: 'spark' | 'puff'
  map: THREE.Texture
  additive: boolean
}

const BillboardCloud = ({ sim, explosion, kind, layer, map, additive }: CloudProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = sim.length
  const isSaucer = kind === 'saucer'
  const isDust = kind === 'dust'

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1)
    const colorArr = new Float32Array(count * 3)
    const opacityArr = new Float32Array(count)
    colorArr.fill(1)
    opacityArr.fill(0)
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(colorArr, 3))
    geo.setAttribute('aOpacity', new THREE.InstancedBufferAttribute(opacityArr, 1))
    const material = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: map } },
      vertexShader: billboardVert,
      fragmentShader: billboardFrag,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      toneMapped: false,
    })
    return { geometry: geo, material }
  }, [count, map, additive])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material]
  )

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const mesh = meshRef.current
    const group = mesh?.parent
    if (!mesh || !group) return

    const ship = useGameStore.getState().state.ship.position
    const dx = wrapDelta(explosion.position.x - ship.x, PLAY_SPACE_SIZE)
    const dy = wrapDelta(explosion.position.y - ship.y, PLAY_SPACE_SIZE)
    const dz = wrapDelta(explosion.position.z - ship.z, PLAY_SPACE_SIZE)
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const proximity = THREE.MathUtils.clamp((dist - 4) / 10, 0, 1)

    _camLocal.copy(state.camera.position)
    group.worldToLocal(_camLocal)

    const colorAttr = mesh.geometry.getAttribute('aColor') as THREE.InstancedBufferAttribute | undefined
    const opacAttr = mesh.geometry.getAttribute('aOpacity') as THREE.InstancedBufferAttribute | undefined
    if (!colorAttr || !opacAttr) return
    const colors = colorAttr.array as Float32Array
    const opacities = opacAttr.array as Float32Array

    for (let i = 0; i < count; i++) {
      const p = sim[i]
      p.life += dt
      const alive = p.life < p.max
      const t = Math.min(1, p.life / p.max)
      if (alive) {
        const drag = Math.max(0, 1 - p.drag * dt)
        p.vx *= drag
        p.vy *= drag
        p.vz *= drag
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.z += p.vz * dt
        p.size = Math.max(0.05, p.size + p.grow * dt)
        p.angle += p.spin * dt
      }

      let r = 1
      let g = 1
      let b = 1
      let a = 0
      if (alive) {
        if (layer === 'spark') {
          if (isDust) {
            r = 0.85
            g = 0.72
            b = 0.48
            a = (1 - t) * 0.7
          } else {
            r = 1
            g = 0.85 - t * 0.55
            b = 0.25 - t * 0.2
            a = (1 - t * t) * 0.7
          }
        } else if (isDust) {
          const shade = 0.55 + (1 - t) * 0.25
          r = shade * 0.92
          g = shade * 0.78
          b = shade * 0.52
          a = Math.sin(Math.min(1, t) * Math.PI) * 0.62
        } else if (isSaucer) {
          r = 1 - t * 0.15
          g = 0.45 - t * 0.25
          b = 0.12
          if (t > 0.45) {
            const u = (t - 0.45) / 0.55
            r = 0.55 * (1 - u) + 0.22 * u
            g = 0.28 * (1 - u) + 0.2 * u
            b = 0.12 * (1 - u) + 0.18 * u
          }
          a = Math.sin(Math.min(1, t) * Math.PI) * 0.5
        } else {
          r = 0.7 - t * 0.25
          g = 0.5 - t * 0.2
          b = 0.32 - t * 0.12
          a = Math.sin(Math.min(1, t) * Math.PI) * 0.55
        }
        a *= proximity
      }

      const idx = i * 3
      colors[idx] = r
      colors[idx + 1] = g
      colors[idx + 2] = b
      opacities[i] = a

      _dummy.position.set(p.x, p.y, p.z)
      _dummy.scale.setScalar(alive ? p.size : 0)
      _dummy.lookAt(_camLocal)
      _dummy.rotateZ(p.angle)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
    }

    colorAttr.needsUpdate = true
    opacAttr.needsUpdate = true
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
      renderOrder={additive ? 3 : 2}
    />
  )
}
