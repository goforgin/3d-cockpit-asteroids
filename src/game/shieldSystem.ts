// Shield: a limited number of bursts per life. Press Z to raise a bubble
// for SHIELD_DURATION; holding Z does nothing extra.

import { Ship } from './types'
import { inputManager } from './input'
import { SHIELD_DURATION } from './constants'

export function isShieldActive(ship: Ship, now: number): boolean {
  return now < ship.shieldActiveUntil
}

export function tryActivateShield(ship: Ship, now: number): Ship {
  if (!inputManager.isKeyDown('z')) {
    return ship
  }

  if (ship.shieldHitsLeft <= 0) {
    return ship
  }

  if (now < ship.shieldActiveUntil) {
    return ship
  }

  return {
    ...ship,
    // Spend a charge on raise so you cannot sit on Z for the whole life.
    shieldHitsLeft: Math.max(0, ship.shieldHitsLeft - 1),
    shieldActiveUntil: now + SHIELD_DURATION * 1000,
  }
}

export function handleShieldHit(ship: Ship): Ship {
  // Charge was already spent when the bubble went up. A hit just pops it.
  return {
    ...ship,
    shieldActiveUntil: 0,
  }
}
