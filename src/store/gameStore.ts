import { create } from 'zustand'
import { GameState } from '../game/types'
import { generateWave } from '../game/waves'
import { destroyAsteroid } from '../game/asteroids'
import { RESPAWN_INVULN, SCORE_BONUS_SHIP, FIRE_RATE, LASER_SPEED, MAX_LASERS, LASER_LIFETIME, SHIELD_HITS_PER_SHIP } from '../game/constants'
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
  removeAsteroidAndSplit: (id: string) => void
  tryFireLaser: () => void
  setLockedTarget: (id: string | null) => void
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
    const newLives = state.state.lives - 1
    const newState: GameState = {
      ...state.state,
      lives: newLives,
      ship: {
        ...state.state.ship,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        rotation: { yaw: 0, pitch: 0 },
        angularVelocity: { yaw: 0, pitch: 0 },
        invulnerableUntil: Date.now() + RESPAWN_INVULN * 1000,
        shieldActiveUntil: 0,
        shieldHitsLeft: SHIELD_HITS_PER_SHIP, // Reset shield on new life
      },
      // Keep asteroids on death - player respawns into same wave
      asteroids: state.state.asteroids,
      lasers: [],
      explosions: [],
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
    import('../audio/audioManager').then(({ audioManager }) => {
      audioManager.playLaser()
    })
    
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
  
  spawnExplosion: (position) => set((state) => {
    const newExplosion = {
      id: `explosion-${Date.now()}`,
      position,
      particles: [],
      createdAt: Date.now(),
    }
    
    return {
      state: {
        ...state.state,
        explosions: [...state.state.explosions, newExplosion],
      }
    }
  }),
  
  removeAsteroidAndSplit: (id) => set((state) => {
    const { remaining, spawned } = destroyAsteroid(state.state.asteroids, id)
    return {
      state: {
        ...state.state,
        asteroids: [...remaining, ...spawned],
      },
    }
  }),
}))
