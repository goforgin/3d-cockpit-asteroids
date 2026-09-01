import { useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { updateAsteroids } from '../game/asteroidPhysics'
import { checkAsteroidShipCollision, checkLaserAsteroidCollision } from '../game/collision'
import { inputManager } from '../game/input'
import { updateShipPhysics } from '../game/shipPhysics'
import { tryActivateShield, isShieldActive, handleShieldHit } from '../game/shieldSystem'
import { tryHyperspace } from '../game/hyperspaceSystem'
import { audioManager } from '../audio/audioManager'
import { SHIP_RADIUS, SCORE_LARGE, SCORE_MEDIUM, SCORE_SMALL, SCORE_BONUS_SHIP, MAX_SPEED } from '../game/constants'

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
    
    // Check for laser firing (Space key)
    if (inputManager.isKeyDown(' ')) {
      useGameStore.getState().tryFireLaser()
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
