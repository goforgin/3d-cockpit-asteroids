import { useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { updateAsteroids } from '../game/asteroidPhysics'
import { checkAsteroidShipCollision, checkLaserAsteroidCollision } from '../game/collision'
import { inputManager } from '../game/input'
import { updateShipPhysics } from '../game/shipPhysics'
import { tryActivateShield, isShieldActive, handleShieldHit } from '../game/shieldSystem'
import { tryHyperspace } from '../game/hyperspaceSystem'
import { audioManager } from '../audio/audioManager'
import { getLockedTargetId, Targetable } from '../game/targeting'
import { updateEnemies, updateEnemyBullets, spawnSaucer, getSaucerDifficulty } from '../game/enemies'
import { wrappedDistance } from '../game/math'
import {
  SHIP_RADIUS, SCORE_LARGE, SCORE_MEDIUM, SCORE_SMALL, SCORE_BONUS_SHIP, MAX_SPEED, FIRE_RATE,
  PLAY_SPACE_SIZE, MAX_SAUCERS, SAUCER_SMALL_DELAY, SAUCER_SMALL_REPEAT, SCORE_SAUCER_LARGE, SCORE_SAUCER_SMALL, ENEMY_BULLET_RADIUS, SAUCER_LOCK_ASSIST,
} from '../game/constants'

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

    // --- Enemy saucers ---
    const waveElapsed = (now - state.waveStartTime) / 1000

    // Move + fire existing saucers.
    const enemyUpdate = updateEnemies(state.enemies, newShip.position, deltaTime, now, waveElapsed)
    useGameStore.getState().setEnemies(enemyUpdate.enemies)
    if (enemyUpdate.newBullets.length > 0) {
      useGameStore.getState().addEnemyBullets(enemyUpdate.newBullets)
      audioManager.playEnemyFire(enemyUpdate.newBullets.some((b) => b.fromSmall))
    }

    // Advance enemy bullets.
    useGameStore.getState().setEnemyBullets(
      updateEnemyBullets(useGameStore.getState().state.enemyBullets, deltaTime)
    )

    // Saucer spawns: one large saucer midway through the wave, then only a small
    // saucer if you're taking a long time (repeating on a long timer). Only ever
    // one saucer at a time.
    const spawnState = useGameStore.getState().state
    if (now >= spawnState.nextSaucerAt && spawnState.enemies.length < MAX_SAUCERS) {
      if (!spawnState.largeSaucerUsed) {
        // The once-per-wave large, easy saucer.
        const saucer = spawnSaucer('large', now, 0)
        useGameStore.getState().setEnemies([...spawnState.enemies, saucer])
        // After it's gone, the small one won't appear until the small delay.
        const nextAt = spawnState.waveStartTime + SAUCER_SMALL_DELAY * 1000
        useGameStore.getState().scheduleNextSaucer(Math.max(now + 12000, nextAt), true)
        audioManager.playSaucerSpawn()
      } else {
        // A lone small saucer; repeats on a long timer if the wave drags on.
        const saucer = spawnSaucer('small', now, getSaucerDifficulty(waveElapsed))
        useGameStore.getState().setEnemies([...spawnState.enemies, saucer])
        useGameStore.getState().scheduleNextSaucer(now + SAUCER_SMALL_REPEAT * 1000, true)
        audioManager.playSaucerSpawn()
      }
    }

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

    // Rocks and saucers are both lockable. Saucers get an inflated capture
    // radius so the reticle grabs the small, moving ones without pixel-perfect aim.
    const targets: Targetable[] = [
      ...aimState.asteroids.map((a) => ({ id: a.id, position: a.position, radius: a.radius })),
      ...aimState.enemies.map((e) => ({ id: e.id, position: e.position, radius: e.radius + SAUCER_LOCK_ASSIST })),
    ]
    const currentLock = aimState.lockedAsteroidId
    const lockValid =
      currentLock !== null && targets.some((t) => t.id === currentLock)

    let nextLock: string | null
    if (arrowHeld || !lockValid) {
      nextLock = getLockedTargetId(aimState.ship, targets)
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

      // Locked on: firing instantly destroys the target (rock or saucer).
      if (willFire && preFire.lockedAsteroidId) {
        const lockId = preFire.lockedAsteroidId
        const rock = preFire.asteroids.find((a) => a.id === lockId)
        const saucer = preFire.enemies.find((e) => e.id === lockId)
        if (rock) {
          useGameStore.getState().spawnExplosion(rock.position)
          useGameStore.getState().addScore(scoreForType(rock.type))
          useGameStore.getState().removeAsteroidAndSplit(rock.id)
          audioManager.playExplosion()
        } else if (saucer) {
          useGameStore.getState().spawnExplosion(saucer.position)
          useGameStore.getState().addScore(
            saucer.type === 'large' ? SCORE_SAUCER_LARGE : SCORE_SAUCER_SMALL
          )
          useGameStore.getState().setEnemies(
            useGameStore.getState().state.enemies.filter((e) => e.id !== saucer.id)
          )
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
    
    // Thrust audio (X key)
    const isThrusting = inputManager.isKeyHeld('x')
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
    
    // Enemy bullets vs ship
    if (now >= state.ship.invulnerableUntil) {
      for (const bullet of state.enemyBullets) {
        if (
          wrappedDistance(bullet.position, state.ship.position, PLAY_SPACE_SIZE) <
          SHIP_RADIUS + ENEMY_BULLET_RADIUS
        ) {
          useGameStore.getState().setEnemyBullets(
            useGameStore.getState().state.enemyBullets.filter((b) => b.id !== bullet.id)
          )
          if (isShieldActive(state.ship, now)) {
            useGameStore.getState().updateShip(handleShieldHit(state.ship))
            audioManager.playShieldHit()
          } else {
            useGameStore.getState().loseLife()
          }
          break
        }
      }
    }

    // Saucer body vs ship
    if (now >= useGameStore.getState().state.ship.invulnerableUntil) {
      const shipNow = useGameStore.getState().state.ship
      for (const enemy of useGameStore.getState().state.enemies) {
        if (
          wrappedDistance(enemy.position, shipNow.position, PLAY_SPACE_SIZE) <
          enemy.radius + SHIP_RADIUS
        ) {
          if (isShieldActive(shipNow, now)) {
            useGameStore.getState().updateShip(handleShieldHit(shipNow))
            audioManager.playShieldHit()
          } else {
            useGameStore.getState().loseLife()
          }
          break
        }
      }
    }

    // Player lasers vs saucers
    {
      const pLasers = useGameStore.getState().state.lasers
      const enemies = useGameStore.getState().state.enemies
      for (const laser of pLasers) {
        for (const enemy of enemies) {
          if (
            wrappedDistance(laser.position, enemy.position, PLAY_SPACE_SIZE) <
            enemy.radius + 1
          ) {
            useGameStore.getState().spawnExplosion(enemy.position)
            audioManager.playExplosion()
            useGameStore.getState().addScore(
              enemy.type === 'large' ? SCORE_SAUCER_LARGE : SCORE_SAUCER_SMALL
            )
            useGameStore.getState().setEnemies(
              useGameStore.getState().state.enemies.filter((e) => e.id !== enemy.id)
            )
            useGameStore.getState().updateLasers(
              useGameStore.getState().state.lasers.filter((l) => l.id !== laser.id)
            )
            break
          }
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
