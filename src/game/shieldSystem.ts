// Shield system for Phase 6

import { Ship } from './types'
import { inputManager } from './input'
import { SHIELD_DURATION } from './constants'

/**
 * Check if shield is currently active
 * @param ship Current ship state
 * @param now Current timestamp in milliseconds
 * @returns true if shield is active
 */
export function isShieldActive(ship: Ship, now: number): boolean {
  return now < ship.shieldActiveUntil
}

/**
 * Try to activate shield on Z key press
 * @param ship Current ship state
 * @param now Current timestamp in milliseconds
 * @returns Updated ship with shield activated (if successful)
 */
export function tryActivateShield(ship: Ship, now: number): Ship {
  // Only activate on Z key press (single press, not held)
  if (!inputManager.isKeyDown('z')) {
    return ship
  }
  
  // Requires shieldHitsLeft > 0
  if (ship.shieldHitsLeft <= 0) {
    return ship
  }
  
  // Requires shield not already active
  if (now < ship.shieldActiveUntil) {
    return ship
  }
  
  // Activate shield for SHIELD_DURATION seconds
  return {
    ...ship,
    shieldActiveUntil: now + SHIELD_DURATION * 1000,
  }
}

/**
 * Handle shield hit from asteroid collision
 * @param ship Current ship state
 * @returns Updated ship with shield hit processed
 */
export function handleShieldHit(ship: Ship): Ship {
  return {
    ...ship,
    shieldHitsLeft: Math.max(0, ship.shieldHitsLeft - 1),
    shieldActiveUntil: 0, // Deactivate shield on hit
  }
}
