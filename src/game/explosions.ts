import { Explosion, Vector3 } from './types'

interface ExplosionOptions {
  count?: number
  minSpeed?: number
  maxSpeed?: number
  minLife?: number
  maxLife?: number
  kind?: 'rock' | 'ship' | 'saucer' | 'dust'
  duration?: number // ms the explosion is drawn before it's culled
  initialSpread?: number // spawn particles already offset from center
}

// Particle positions are stored RELATIVE to the explosion center (which starts
// at {0,0,0} and drifts outward), so the renderer can place the whole burst at
// any world/screen position it likes.
const buildExplosion = (position: Vector3, opts: ExplosionOptions = {}): Explosion => {
  const {
    count = 30,
    minSpeed = 5,
    maxSpeed = 15,
    minLife = 0.5,
    maxLife = 0.8,
    kind = 'rock',
    duration = 700,
    initialSpread = 0,
  } = opts

  const particles = []
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)
    const dirX = Math.sin(phi) * Math.cos(theta)
    const dirY = Math.sin(phi) * Math.sin(theta)
    const dirZ = Math.cos(phi)
    const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed
    const spawnR = initialSpread * Math.random()

    particles.push({
      position: {
        x: dirX * spawnR,
        y: dirY * spawnR,
        z: dirZ * spawnR,
      },
      velocity: {
        x: dirX * speed,
        y: dirY * speed,
        z: dirZ * speed,
      },
      lifetime: 0,
      maxLifetime: minLife + Math.random() * (maxLife - minLife),
    })
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

// Standard rock-shatter burst.
export const spawnExplosion = (position: Vector3): Explosion =>
  buildExplosion(position, { count: 34, minSpeed: 6, maxSpeed: 20, duration: 700 })

// Saucer burst. Keep the mote count modest — hundreds of overlapping additive
// sprites plus bloom previously locked the framebuffer white.
export const spawnSaucerExplosion = (position: Vector3): Explosion =>
  buildExplosion(position, {
    count: 48,
    minSpeed: 8,
    maxSpeed: 22,
    minLife: 0.5,
    maxLife: 0.95,
    kind: 'saucer',
    duration: 1100,
    initialSpread: 1.6,
  })

// Small asteroid dust cloud: slow puff of debris
export const spawnDustCloud = (position: Vector3): Explosion =>
  buildExplosion(position, {
    count: 70,
    minSpeed: 1.2,
    maxSpeed: 5.5,
    minLife: 0.6,
    maxLife: 1.2,
    kind: 'dust',
    duration: 1200,
    initialSpread: 1.2,
  })

// Bigger, fierier, longer-lived burst for the player's ship being destroyed.
export const spawnShipExplosion = (position: Vector3): Explosion =>
  buildExplosion(position, {
    count: 90,
    minSpeed: 10,
    maxSpeed: 42,
    minLife: 0.7,
    maxLife: 1.4,
    kind: 'ship',
    duration: 1500,
  })
