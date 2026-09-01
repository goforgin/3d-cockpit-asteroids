// Hyperspace system for Phase 6

import { Ship } from './types'
import { inputManager } from './input'
import { HYPERSPACE_COOLDOWN, PLAY_SPACE_SIZE } from './constants'
import { randomRange } from './math'

/**
 * Try to execute hyperspace jump on Shift key press
 * @param ship Current ship state
 * @param now Current timestamp in milliseconds
 * @returns Object with updated ship and died flag
 */
export function tryHyperspace(ship: Ship, now: number): { ship: Ship; died: boolean } {
  // Only on Shift key press (single press, not held)
  if (!inputManager.isKeyDown('shift')) {
    return { ship, died: false }
  }
  
  // Requires cooldown to have elapsed
  if (now < ship.hyperspaceCooldownUntil) {
    return { ship, died: false }
  }
  
  // 1% chance of instant death (classic Asteroids risk)
  if (Math.random() < 0.01) {
    return { ship, died: true }
  }
  
  // 99% chance: successful hyperspace
  const newShip: Ship = {
    ...ship,
    // Random position within the play volume (kept a little off the edges)
    position: {
      x: randomRange(-PLAY_SPACE_SIZE * 0.45, PLAY_SPACE_SIZE * 0.45),
      y: randomRange(-PLAY_SPACE_SIZE * 0.45, PLAY_SPACE_SIZE * 0.45),
      z: randomRange(-PLAY_SPACE_SIZE * 0.45, PLAY_SPACE_SIZE * 0.45),
    },
    // Clear velocity and any residual spin
    velocity: { x: 0, y: 0, z: 0 },
    angularVelocity: { yaw: 0, pitch: 0 },
    // 1 second invulnerability after jump
    invulnerableUntil: now + 1000,
    // Set cooldown
    hyperspaceCooldownUntil: now + HYPERSPACE_COOLDOWN * 1000,
  }
  
  return { ship: newShip, died: false }
}
