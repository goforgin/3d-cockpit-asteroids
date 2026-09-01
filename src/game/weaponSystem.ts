// Weapon system for laser firing

import { GameState } from '../game/types'
import { inputManager } from '../game/input'
import { FIRE_RATE, LASER_SPEED } from '../game/constants'

// Compute forward vector from yaw/pitch
const getForwardVector = (yaw: number, pitch: number): { x: number; y: number; z: number } => {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  
  return {
    x: -sy * cp,
    y: -sp,
    z: cy * cp,
  }
}

// Try to fire a laser, returns laser if fired, null otherwise
export const tryFireLaser = (state: GameState): { laser: any; shouldFire: boolean } => {
  const now = Date.now()
  const lastShotTime = state.lastShotTime
  const fireRateMs = 1000 / FIRE_RATE
  
  // Check fire rate limit
  if (now - lastShotTime < fireRateMs) {
    return { laser: null, shouldFire: false }
  }
  
  // Check max lasers
  if (state.lasers.length >= 4) {
    return { laser: null, shouldFire: false }
  }
  
  // Check Space key
  if (!inputManager.isKeyDown(' ')) {
    return { laser: null, shouldFire: false }
  }
  
  // Create laser
  const forward = getForwardVector(state.ship.rotation.yaw, state.ship.rotation.pitch)
  
  const laser = {
    id: `laser-${now}`,
    position: state.ship.position,
    velocity: {
      x: forward.x * LASER_SPEED,
      y: forward.y * LASER_SPEED,
      z: forward.z * LASER_SPEED,
    },
    lifetime: 1.5,
  }
  
  return { laser, shouldFire: true }
}
