import { Explosion, Vector3 } from './types'

interface ExplosionOptions {
  count?: number
  minSpeed?: number
  maxSpeed?: number
  minLife?: number
  maxLife?: number
  kind?: 'rock' | 'ship'
  duration?: number // ms the explosion is drawn before it's culled
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
  } = opts

  const particles = []
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)
    const speed = Math.random() * (maxSpeed - minSpeed) + minSpeed

    particles.push({
      position: { x: 0, y: 0, z: 0 },
      velocity: {
        x: speed * Math.sin(phi) * Math.cos(theta),
        y: speed * Math.sin(phi) * Math.sin(theta),
        z: speed * Math.cos(phi),
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
