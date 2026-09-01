import { useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { updateAsteroids } from '../game/asteroidPhysics'
import { checkAsteroidShipCollision, checkLaserAsteroidCollision } from '../game/collision'
import { inputManager } from '../game/input'
import { updateShipPhysics } from '../game/shipPhysics'
import { tryActivateShield, isShieldActive, handleShieldHit } from '../game/shieldSystem'
import { tryHyperspace } from '../game/hyperspaceSystem'
import { audioManager } from '../audio/audioManager'
import { getLockedAsteroidId } from '../game/targeting'
import { SHIP_RADIUS, SCORE_LARGE, SCORE_MEDIUM, SCORE_SMALL, SCORE_BONUS_SHIP, MAX_SPEED, FIRE_RATE } from '../game/constants'

const scoreForType = (type: 'large' | 'medium' | 'small'): number =>
  type === 'large' ? SCORE_LARGE : type === 'medium' ? SCORE_MEDIUM : SCORE_SMALL

export const useGameSimulation = () => {
  const simulationTick = useCallback((deltaTime: number) => {
    // Update input manager first
    inputManager.update(deltaTime)
    
    const state = useGameStore.getState().state
    const now = Date.now()
    
    // Skip if not playing
    if (state.gameState !== 'playing') return
    
    // Update ship physics
    const newShip = updateShipPhysics(state.ship, deltaTime)
    useGameStore.getState().updateShip(newShip)
    
    // Shield activation (Z key)
    const shieldedShip = tryActivateShield(newShip, now)
    if (shieldedShip !== newShip) {
      useGameStore.getState().updateShip(shieldedShip)
      // Play shield activation sound
      audioManager.playShieldOn()
    }
    
    // Hyperspace (Shift key)
    const hyperspaceResult = tryHyperspace(shieldedShip, now)
    if (hyperspaceResult.died) {
      useGameStore.getState().loseLife()
    } else if (hyperspaceResult.ship !== shieldedShip) {
      useGameStore.getState().updateShip(hyperspaceResult.ship)
      // Play hyperspace sound
      audioManager.playHyperspace()
    }
    
    // Update asteroids
    useGameStore.getState().updateAsteroids(
      updateAsteroids(state.asteroids, deltaTime)
    )
    
    // Update lasers
    const lasers = state.lasers.map(laser => ({
      ...laser,
      lifetime: laser.lifetime - deltaTime,
      position: {
        x: laser.position.x + laser.velocity.x * deltaTime,
        y: laser.position.y + laser.velocity.y * deltaTime,
        z: laser.position.z + laser.velocity.z * deltaTime,
      },
    })).filter(laser => laser.lifetime > 0)
    
    useGameStore.getState().updateLasers(lasers)

    // Update lock-on target. The lock is "sticky": once acquired it stays on
    // that rock until the player presses an arrow key to re-aim (or the target
    // is destroyed). When there is no valid lock we continuously scan so it
    // acquires as soon as the crosshair touches a rock.
    const aimState = useGameStore.getState().state
    const arrowHeld =
      inputManager.isKeyHeld('arrowleft') ||
      inputManager.isKeyHeld('arrowright') ||
      inputManager.isKeyHeld('arrowup') ||
      inputManager.isKeyHeld('arrowdown')
    const currentLock = aimState.lockedAsteroidId
    const lockValid =
      currentLock !== null && aimState.asteroids.some((a) => a.id === currentLock)

    let nextLock: string | null
    if (arrowHeld || !lockValid) {
      nextLock = getLockedAsteroidId(aimState.ship, aimState.asteroids)
    } else {
      nextLock = currentLock
    }
    useGameStore.getState().setLockedTarget(nextLock)

    // Check for laser firing (Space key)
    if (inputManager.isKeyDown(' ')) {
      const preFire = useGameStore.getState().state
      const fireRateMs = 1000 / FIRE_RATE
      const willFire = now - preFire.lastShotTime >= fireRateMs

      // Fire the visual bolt + sound + rate limit
      useGameStore.getState().tryFireLaser()

      // Locked on: firing instantly destroys the targeted rock.
      if (willFire && preFire.lockedAsteroidId) {
        const target = preFire.asteroids.find((a) => a.id === preFire.lockedAsteroidId)
        if (target) {
          useGameStore.getState().spawnExplosion(target.position)
          useGameStore.getState().addScore(scoreForType(target.type))
          useGameStore.getState().removeAsteroidAndSplit(target.id)
          audioManager.playExplosion()
        }
      }
    }
    
    // Check collisions with fresh state
    checkCollisions()
    
    // Check for wave progression
    checkWaveProgression()
    
    // Check for bonus life
    checkBonusLife()
    
    // Thrust audio (Alt key)
    const isThrusting = inputManager.isKeyHeld('alt')
    if (isThrusting) {
      audioManager.startThrust()
      // Calculate speed ratio for volume modulation
      const speed = Math.sqrt(
        newShip.velocity.x * newShip.velocity.x +
        newShip.velocity.y * newShip.velocity.y +
        newShip.velocity.z * newShip.velocity.z
      )
      const speedRatio = Math.min(1, speed / MAX_SPEED)
      audioManager.setThrustVolume(speedRatio)
    } else {
      audioManager.stopThrust()
    }
  }, [])
  
  const checkCollisions = () => {
    const state = useGameStore.getState().state
    const now = Date.now()
    
    // Ship vs asteroids (skip if invulnerable)
    if (now >= state.ship.invulnerableUntil) {
      for (const asteroid of state.asteroids) {
        if (checkAsteroidShipCollision(state.ship.position, asteroid, SHIP_RADIUS)) {
          // Check if shield is active
          if (isShieldActive(state.ship, now)) {
            // Shield absorbs the hit
            const hitShip = handleShieldHit(state.ship)
            useGameStore.getState().updateShip(hitShip)
            // Play shield hit sound
            audioManager.playShieldHit()
          } else {
            // No shield - lose life
            useGameStore.getState().loseLife()
          }
          break
        }
      }
    }
    
    // Lasers vs asteroids
    const lasers = useGameStore.getState().state.lasers
    const asteroids = useGameStore.getState().state.asteroids
    
    for (const laser of lasers) {
      for (const asteroid of asteroids) {
        if (checkLaserAsteroidCollision(laser, asteroid)) {
          // Spawn explosion at asteroid position
          useGameStore.getState().spawnExplosion(asteroid.position)
          // Play explosion sound
          audioManager.playExplosion()
          
          // Remove asteroid and spawn children
          useGameStore.getState().removeAsteroidAndSplit(asteroid.id)
          // Add score based on asteroid type
          useGameStore.getState().addScore(
            asteroid.type === 'large' ? SCORE_LARGE :
            asteroid.type === 'medium' ? SCORE_MEDIUM : SCORE_SMALL
          )
          // Remove the laser that hit
          useGameStore.getState().updateLasers(
            useGameStore.getState().state.lasers.filter(l => l.id !== laser.id)
          )
          break
        }
      }
    }
  }
  
  const checkWaveProgression = () => {
    const state = useGameStore.getState().state
    if (state.asteroids.length === 0) {
      useGameStore.getState().spawnWave(state.wave + 1)
    }
  }
  
  const checkBonusLife = () => {
    const state = useGameStore.getState().state
    const bonusThreshold = SCORE_BONUS_SHIP
    
    // Check if score crossed a bonus threshold
    if (state.score > 0 && state.score % bonusThreshold === 0) {
      // Play extra life jingle
      audioManager.playExtraLife()
    }
  }
  
  return { simulationTick }
}
