// Lock-on targeting: find the asteroid currently under the crosshair.

import { Ship, Asteroid } from './types'
import { getForwardVector } from './shipPhysics'

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
    const dx = a.position.x - ship.position.x
    const dy = a.position.y - ship.position.y
    const dz = a.position.z - ship.position.z

    // Distance along the aim ray to the asteroid's closest approach.
    const t = dx * f.x + dy * f.y + dz * f.z
    if (t <= 0) continue // asteroid is behind the ship

    // Closest point on the ray to the asteroid center.
    const cx = ship.position.x + f.x * t
    const cy = ship.position.y + f.y * t
    const cz = ship.position.z + f.z * t

    const perpX = a.position.x - cx
    const perpY = a.position.y - cy
    const perpZ = a.position.z - cz
    const perp = Math.sqrt(perpX * perpX + perpY * perpY + perpZ * perpZ)

    if (perp <= a.radius + aimAssist && t < bestDistance) {
      bestDistance = t
      bestId = a.id
    }
  }

  return bestId
}
