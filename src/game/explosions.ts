import { Explosion, ExplosionLayer, Vector3 } from './types'

interface ExplosionOptions {
  kind?: 'rock' | 'ship' | 'saucer' | 'dust'
  duration?: number
  sparks?: number
  puffs?: number
}

const dirOnSphere = (): Vector3 => {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(Math.random() * 2 - 1)
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.sin(phi) * Math.sin(theta),
    z: Math.cos(phi),
  }
}

const particle = (
  dir: Vector3,
  layer: ExplosionLayer,
  opts: {
    speed: number
    spread: number
    size: number
    grow: number
    life: number
    drag: number
    spin: number
  }
) => {
  const spawnR = opts.spread * Math.random()
  return {
    position: {
      x: dir.x * spawnR,
      y: dir.y * spawnR,
      z: dir.z * spawnR,
    },
    velocity: {
      x: dir.x * opts.speed,
      y: dir.y * opts.speed,
      z: dir.z * opts.speed,
    },
    lifetime: 0,
    maxLifetime: opts.life,
    size: opts.size,
    grow: opts.grow,
    drag: opts.drag,
    spin: opts.spin,
    layer,
  }
}

const buildExplosion = (position: Vector3, opts: ExplosionOptions = {}): Explosion => {
  const {
    kind = 'rock',
    duration = 900,
    sparks = 16,
    puffs = 12,
  } = opts

  const particles = []

  for (let i = 0; i < sparks; i++) {
    const dir = dirOnSphere()
    particles.push(
      particle(dir, 'spark', {
        speed: (kind === 'dust' ? 3 : 10) + Math.random() * (kind === 'dust' ? 4 : 16),
        spread: kind === 'dust' ? 0.4 : 0.6,
        size: (kind === 'dust' ? 0.25 : 0.45) + Math.random() * 0.5,
        grow: kind === 'dust' ? -0.05 : -0.12,
        life: 0.35 + Math.random() * 0.45,
        drag: 1.8 + Math.random(),
        spin: (Math.random() - 0.5) * 8,
      })
    )
  }

  for (let i = 0; i < puffs; i++) {
    const dir = dirOnSphere()
    const dusty = kind === 'dust'
    particles.push(
      particle(dir, 'puff', {
        speed: (dusty ? 1.1 : 2.2) + Math.random() * (dusty ? 3.2 : 5.5),
        spread: dusty ? 1.1 : 0.8,
        size: (dusty ? 2.0 : 1.2) + Math.random() * (dusty ? 2.2 : 1.6),
        grow: (dusty ? 3.2 : 2.0) + Math.random() * 1.6,
        life: (dusty ? 0.9 : 0.7) + Math.random() * (dusty ? 0.8 : 0.55),
        drag: dusty ? 2.4 : 1.6,
        spin: (Math.random() - 0.5) * 2.5,
      })
    )
  }

  return {
    id: `explosion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    position: { ...position },
    particles,
    createdAt: Date.now(),
    kind,
    duration,
  }
}

export const spawnExplosion = (position: Vector3): Explosion =>
  buildExplosion(position, {
    kind: 'rock',
    duration: 1100,
    sparks: 18,
    puffs: 14,
  })

export const spawnSaucerExplosion = (position: Vector3): Explosion =>
  buildExplosion(position, {
    kind: 'saucer',
    duration: 1400,
    sparks: 22,
    puffs: 16,
  })

export const spawnDustCloud = (position: Vector3): Explosion =>
  buildExplosion(position, {
    kind: 'dust',
    duration: 1700,
    sparks: 8,
    puffs: 22,
  })

export const spawnShipExplosion = (position: Vector3): Explosion =>
  buildExplosion(position, {
    kind: 'ship',
    duration: 1500,
    sparks: 20,
    puffs: 14,
  })
