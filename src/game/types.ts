// Game types

export type Vector3 = {
  x: number
  y: number
  z: number
}

export type AsteroidType = 'large' | 'medium' | 'small'

export interface Asteroid {
  id: string
  position: Vector3
  velocity: Vector3
  radius: number
  type: AsteroidType
  rotationSpeed: Vector3
  rotation: Vector3
}

export interface Ship {
  position: Vector3
  velocity: Vector3
  rotation: {
    yaw: number   // Y-axis rotation
    pitch: number // X-axis rotation
  }
  invulnerableUntil: number
  shieldActiveUntil: number   // timestamp ms when shield expires
  shieldHitsLeft: number
  hyperspaceCooldownUntil: number
}

export interface Laser {
  id: string
  position: Vector3
  velocity: Vector3
  lifetime: number
}

export interface ExplosionParticle {
  position: Vector3
  velocity: Vector3
  lifetime: number
  maxLifetime: number
}

export interface Explosion {
  id: string
  position: Vector3
  particles: ExplosionParticle[]
  createdAt: number
}

export interface GameState {
  score: number
  lives: number
  wave: number
  gameState: 'menu' | 'playing' | 'paused' | 'gameover'
  asteroids: Asteroid[]
  lasers: Laser[]
  explosions: Explosion[]
  ship: Ship
  lastShotTime: number
}

export interface WaveConfig {
  count: number
  size: 'large' | 'medium' | 'small'
}
