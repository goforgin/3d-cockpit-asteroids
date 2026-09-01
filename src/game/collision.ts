// Collision detection

import { Asteroid, Vector3 } from './types'

export const checkAsteroidShipCollision = (
  shipPosition: Vector3,
  asteroid: Asteroid,
  shipRadius: number
): boolean => {
  const dist = Math.sqrt(
    Math.pow(asteroid.position.x - shipPosition.x, 2) +
    Math.pow(asteroid.position.y - shipPosition.y, 2) +
    Math.pow(asteroid.position.z - shipPosition.z, 2)
  )
  return dist < (asteroid.radius + shipRadius)
}

export const checkLaserAsteroidCollision = (
  laser: { position: Vector3; velocity: Vector3; lifetime: number },
  asteroid: Asteroid
): boolean => {
  const dist = Math.sqrt(
    Math.pow(laser.position.x - asteroid.position.x, 2) +
    Math.pow(laser.position.y - asteroid.position.y, 2) +
    Math.pow(laser.position.z - asteroid.position.z, 2)
  )
  return dist < asteroid.radius
}

export const getAsteroidSplitType = (type: 'large' | 'medium' | 'small'): 'medium' | 'small' | null => {
  if (type === 'large') return 'medium'
  if (type === 'medium') return 'small'
  return null
}
