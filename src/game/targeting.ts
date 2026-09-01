// Lock-on targeting: find the asteroid currently under the crosshair.

import { Ship, Asteroid } from './types'
import { getForwardVector } from './shipPhysics'
import { wrapDelta } from './math'
import { PLAY_SPACE_SIZE } from './constants'

// Casts a ray from the ship along its forward axis (the crosshair direction)
// and returns the id of the nearest asteroid that ray passes through.
//
// An asteroid counts as "under the crosshair" when the perpendicular distance
// from its center to the aim ray is within its radius (plus a small aim assist
// so locking feels responsive). Among all such asteroids in front of the ship,
// the closest one wins.
export function getLockedAsteroidId(
  ship: Ship,
  asteroids: Asteroid[],
  aimAssist = 2
): string | null {
  const f = getForwardVector(ship.rotation.yaw, ship.rotation.pitch)

  let bestId: string | null = null
  let bestDistance = Infinity

  for (const a of asteroids) {
    // Wrapped offset so rocks across the zone boundary can still be locked.
    const dx = wrapDelta(a.position.x - ship.position.x, PLAY_SPACE_SIZE)
    const dy = wrapDelta(a.position.y - ship.position.y, PLAY_SPACE_SIZE)
    const dz = wrapDelta(a.position.z - ship.position.z, PLAY_SPACE_SIZE)

    // Distance along the aim ray to the asteroid's closest approach.
    const t = dx * f.x + dy * f.y + dz * f.z
    if (t <= 0) continue // asteroid is behind the ship

    // Perpendicular distance from the asteroid center to the aim ray.
    const perpX = dx - f.x * t
    const perpY = dy - f.y * t
    const perpZ = dz - f.z * t
    const perp = Math.sqrt(perpX * perpX + perpY * perpY + perpZ * perpZ)

    if (perp <= a.radius + aimAssist && t < bestDistance) {
      bestDistance = t
      bestId = a.id
    }
  }

  return bestId
}
