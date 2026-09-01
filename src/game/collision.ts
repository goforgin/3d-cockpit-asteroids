// Collision detection (toroidal — accounts for wrap-around at the zone edges)

import { Asteroid, Vector3 } from './types'
import { wrappedDistance } from './math'
import { PLAY_SPACE_SIZE } from './constants'

export const checkAsteroidShipCollision = (
  shipPosition: Vector3,
  asteroid: Asteroid,
  shipRadius: number
): boolean => {
  const dist = wrappedDistance(asteroid.position, shipPosition, PLAY_SPACE_SIZE)
  return dist < (asteroid.radius + shipRadius)
}

export const checkLaserAsteroidCollision = (
  laser: { position: Vector3; velocity: Vector3; lifetime: number },
  asteroid: Asteroid
): boolean => {
  const dist = wrappedDistance(laser.position, asteroid.position, PLAY_SPACE_SIZE)
  return dist < asteroid.radius
}

export const getAsteroidSplitType = (type: 'large' | 'medium' | 'small'): 'medium' | 'small' | null => {
  if (type === 'large') return 'medium'
  if (type === 'medium') return 'small'
  return null
}
