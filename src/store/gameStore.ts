import { create } from 'zustand'
import { GameState, EnemySaucer, EnemyBullet } from '../game/types'
import { generateWave } from '../game/waves'
import { destroyAsteroid } from '../game/asteroids'
import { spawnExplosion, spawnSaucerExplosion, spawnDustCloud } from '../game/explosions'
import { RESPAWN_INVULN, START_INVULN, SCORE_BONUS_SHIP, FIRE_RATE, LASER_SPEED, MAX_LASERS, LASER_LIFETIME, SHIELD_HITS_PER_SHIP, SAUCER_LARGE_DELAY } from '../game/constants'
import { audioManager } from '../audio/audioManager'
import { getForwardVector } from '../game/shipPhysics'

interface GameStore {
  state: GameState
  muted: boolean
  muteFlashUntil: number   // timestamp; show a MUTED/UNMUTED toast until this
  toggleMute: () => void
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  gameOver: () => void
  addScore: (points: number) => void
  loseLife: () => void
  spawnWave: (waveNumber: number) => void
  fireLaser: (position: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }) => void
  updateShip: (ship: GameState['ship']) => void
  updateAsteroids: (asteroids: GameState['asteroids']) => void
  updateLasers: (lasers: GameState['lasers']) => void
  updateExplosions: (explosions: GameState['explosions']) => void
  spawnExplosion: (position: { x: number; y: number; z: number }) => void
  spawnSaucerExplosion: (position: { x: number; y: number; z: number }) => void
  spawnDustCloud: (position: { x: number; y: number; z: number }) => void
  removeAsteroidAndSplit: (id: string) => void
  tryFireLaser: () => void
  setLockedTarget: (id: string | null) => void
  setEnemies: (enemies: EnemySaucer[]) => void
  setEnemyBullets: (bullets: EnemyBullet[]) => void
  addEnemyBullets: (bullets: EnemyBullet[]) => void
  scheduleNextSaucer: (at: number, largeUsed?: boolean) => void
}

export const useGameStore = create<GameStore>((set) => ({
  state: {
    score: 0,
    lives: 3,
    wave: 1,
    gameState: 'menu',
    asteroids: [],
    lasers: [],
    explosions: [],
    enemies: [],
    enemyBullets: [],
    ship: {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      rotation: { yaw: 0, pitch: 0 },
      angularVelocity: { yaw: 0, pitch: 0 },
      invulnerableUntil: 0,
      shieldActiveUntil: 0,
      shieldHitsLeft: 3,
      hyperspaceCooldownUntil: 0,
    },
    lastShotTime: 0,
    lockedAsteroidId: null,
    shipHitAt: 0,
    waveStartTime: 0,
    nextSaucerAt: 0,
    largeSaucerUsed: false,
  },

  muted: false,
  muteFlashUntil: 0,

  toggleMute: () => set(() => {
    const muted = audioManager.toggleMute()
    return { muted, muteFlashUntil: Date.now() + 1500 }
  }),
  
  startGame: () => set({
    state: {
      score: 0,
      lives: 3,
      wave: 1,
      gameState: 'playing',
      asteroids: generateWave(1),
      lasers: [],
      explosions: [],
      enemies: [],
      enemyBullets: [],
      ship: {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        rotation: { yaw: 0, pitch: 0 },
        angularVelocity: { yaw: 0, pitch: 0 },
        // Opening grace so inbound rocks can't land a hit before you can steer.
        invulnerableUntil: Date.now() + START_INVULN * 1000,
        shieldActiveUntil: 0,
        shieldHitsLeft: 3,
        hyperspaceCooldownUntil: 0,
      },
      lastShotTime: 0,
      lockedAsteroidId: null,
      shipHitAt: 0,
      waveStartTime: Date.now(),
      nextSaucerAt: Date.now() + SAUCER_LARGE_DELAY * 1000,
      largeSaucerUsed: false,
    }
  }),
  
  pauseGame: () => set((state) => ({
    state: { ...state.state, gameState: 'paused' }
  })),
  
  resumeGame: () => set((state) => ({
    state: { ...state.state, gameState: 'playing' }
  })),
  
  gameOver: () => set((state) => ({
    state: { ...state.state, gameState: 'gameover' }
  })),
  
  addScore: (points) => set((state) => {
    const newScore = state.state.score + points
    const bonusThreshold = SCORE_BONUS_SHIP
    const previousBonus = Math.floor(state.state.score / bonusThreshold) * bonusThreshold
    const newBonus = Math.floor(newScore / bonusThreshold) * bonusThreshold
    
    return {
      state: {
        ...state.state,
        score: newScore,
        lives: state.state.lives + (newBonus > previousBonus ? 1 : 0),
      }
    }
  }),
  
  loseLife: () => set((state) => {
    const now = Date.now()
    const newLives = state.state.lives - 1

    // Death VFX is the HUD overlay (flames + SHIP DESTROYED). Do NOT spawn an
    // additive particle burst on the camera — that fills the view with white
    // and can stick the GPU blend mode so even a new game stays blank.
    const newState: GameState = {
      ...state.state,
      lives: newLives,
      shipHitAt: now,
      ship: {
        ...state.state.ship,
        velocity: { x: 0, y: 0, z: 0 },
        angularVelocity: { yaw: 0, pitch: 0 },
        invulnerableUntil: now + RESPAWN_INVULN * 1000,
        shieldActiveUntil: 0,
        shieldHitsLeft: SHIELD_HITS_PER_SHIP,
      },
      asteroids: state.state.asteroids,
      lasers: [],
      explosions: [],
      enemyBullets: [],
    }
    
    // Play ship explosion sound
    audioManager.playShipExplode()
    
    // Check for game over
    if (newLives <= 0) {
      newState.gameState = 'gameover'
    }
    
    return { state: newState }
  }),
  
  spawnWave: (waveNumber) => set((state) => ({
    state: {
      ...state.state,
      wave: waveNumber,
      asteroids: generateWave(waveNumber),
      // Fresh wave: clear saucers/fire and restart the spawn clock.
      enemies: [],
      enemyBullets: [],
      waveStartTime: Date.now(),
      nextSaucerAt: Date.now() + SAUCER_LARGE_DELAY * 1000,
      largeSaucerUsed: false,
    }
  })),
  
  fireLaser: (position, direction) => set((state) => {
    const currentLasers = state.state.lasers
    if (currentLasers.length >= MAX_LASERS) {
      return { state: state.state }
    }
    
    const normalizedDir = {
      x: direction.x / Math.sqrt(direction.x**2 + direction.y**2 + direction.z**2),
      y: direction.y / Math.sqrt(direction.x**2 + direction.y**2 + direction.z**2),
      z: direction.z / Math.sqrt(direction.x**2 + direction.y**2 + direction.z**2),
    }
    
    return {
      state: {
        ...state.state,
        lasers: [
          ...currentLasers,
          {
            id: `laser-${Date.now()}`,
            position,
            velocity: {
              x: normalizedDir.x * LASER_SPEED,
              y: normalizedDir.y * LASER_SPEED,
              z: normalizedDir.z * LASER_SPEED,
            },
            lifetime: LASER_LIFETIME,
          },
        ].slice(-MAX_LASERS),
        lastShotTime: Date.now(),
      }
    }
  }),
  
  tryFireLaser: () => set((state) => {
    const now = Date.now()
    const lastShotTime = state.state.lastShotTime
    const fireRateMs = 1000 / FIRE_RATE
    
    if (now - lastShotTime < fireRateMs) {
      return { state: state.state }
    }
    
    const ship = state.state.ship
    // Fire along the exact direction the cockpit/crosshair points.
    const forward = getForwardVector(ship.rotation.yaw, ship.rotation.pitch)

    // Spawn the bolt slightly ahead of the cockpit so it reads as coming from
    // the ship's nose rather than materializing on top of the camera.
    const muzzleOffset = 3
    const spawnPosition = {
      x: ship.position.x + forward.x * muzzleOffset,
      y: ship.position.y + forward.y * muzzleOffset,
      z: ship.position.z + forward.z * muzzleOffset,
    }

    // Play laser sound
    audioManager.playLaser()
    
    return {
      state: {
        ...state.state,
        lasers: [
          ...state.state.lasers,
          {
            id: `laser-${Date.now()}`,
            position: spawnPosition,
            velocity: {
              x: forward.x * LASER_SPEED,
              y: forward.y * LASER_SPEED,
              z: forward.z * LASER_SPEED,
            },
            lifetime: LASER_LIFETIME,
          },
        ].slice(-MAX_LASERS),
        lastShotTime: now,
      }
    }
  }),
  
  updateShip: (ship) => set((state) => ({
    state: { ...state.state, ship }
  })),

  // Only writes when the lock actually changes so subscribers (the crosshair)
  // don't re-render every frame.
  setLockedTarget: (id) => set((state) =>
    state.state.lockedAsteroidId === id
      ? state
      : { state: { ...state.state, lockedAsteroidId: id } }
  ),
  
  updateAsteroids: (asteroids) => set((state) => ({
    state: { ...state.state, asteroids }
  })),
  
  updateLasers: (lasers) => set((state) => ({
    state: { ...state.state, lasers }
  })),
  
  updateExplosions: (explosions) => set((state) => ({
    state: { ...state.state, explosions }
  })),

  spawnSaucerExplosion: (position) => set((state) => ({
    state: {
      ...state.state,
      explosions: [...state.state.explosions, spawnSaucerExplosion(position)],
    }
  })),

  spawnDustCloud: (position) => set((state) => ({
    state: {
      ...state.state,
      explosions: [...state.state.explosions, spawnDustCloud(position)],
    }
  })),

  setEnemies: (enemies) => set((state) => ({
    state: { ...state.state, enemies }
  })),

  setEnemyBullets: (enemyBullets) => set((state) => ({
    state: { ...state.state, enemyBullets }
  })),

  addEnemyBullets: (bullets) => set((state) => ({
    state: { ...state.state, enemyBullets: [...state.state.enemyBullets, ...bullets] }
  })),

  scheduleNextSaucer: (at, largeUsed) => set((state) => ({
    state: {
      ...state.state,
      nextSaucerAt: at,
      largeSaucerUsed: largeUsed ?? state.state.largeSaucerUsed,
    }
  })),
  
  spawnExplosion: (position) => set((state) => ({
    state: {
      ...state.state,
      explosions: [...state.state.explosions, spawnExplosion(position)],
    }
  })),
  
  removeAsteroidAndSplit: (id) => set((state) => {
    const { remaining, spawned } = destroyAsteroid(
      state.state.asteroids,
      id,
      state.state.ship.position
    )
    return {
      state: {
        ...state.state,
        asteroids: [...remaining, ...spawned],
      },
    }
  }),
}))
