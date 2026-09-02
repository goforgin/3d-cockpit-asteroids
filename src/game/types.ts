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
  angularVelocity: {
    yaw: number   // rad/s, ramps up/down for joystick-style aiming
    pitch: number
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

export type SaucerType = 'large' | 'small'

export interface EnemySaucer {
  id: string
  type: SaucerType
  position: Vector3
  velocity: Vector3
  radius: number
  spawnedAt: number
  nextTurnAt: number  // when the saucer next changes heading
  nextFireAt: number  // when the saucer next shoots
}

export interface EnemyBullet {
  id: string
  position: Vector3
  velocity: Vector3
  lifetime: number
  fromSmall: boolean  // small-saucer bullets look/behave nastier
}

export type ExplosionLayer = 'spark' | 'puff'

export interface ExplosionParticle {
  position: Vector3
  velocity: Vector3
  lifetime: number
  maxLifetime: number
  size: number
  grow: number
  drag: number
  spin: number
  layer: ExplosionLayer
}

export interface Explosion {
  id: string
  position: Vector3
  particles: ExplosionParticle[]
  createdAt: number
  kind?: 'rock' | 'ship' | 'saucer' | 'dust'
  duration?: number // ms before culled (defaults to 600)
}

export interface GameState {
  score: number
  lives: number
  wave: number
  gameState: 'menu' | 'playing' | 'paused' | 'gameover'
  asteroids: Asteroid[]
  lasers: Laser[]
  explosions: Explosion[]
  enemies: EnemySaucer[]
  enemyBullets: EnemyBullet[]
  ship: Ship
  lastShotTime: number
  lockedAsteroidId: string | null   // asteroid currently under the crosshair
  shipHitAt: number                 // timestamp of last ship destruction (for VFX/overlay)
  waveStartTime: number             // when the current wave began (drives saucer spawns)
  nextSaucerAt: number              // timestamp the next saucer is allowed to spawn
  largeSaucerUsed: boolean          // the once-per-wave large saucer has appeared
}

export interface WaveConfig {
  count: number
  size: 'large' | 'medium' | 'small'
}
