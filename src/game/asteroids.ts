// Asteroid splitting and destruction logic

import { Asteroid, Vector3 } from './types'
import { randomRange } from './math'
import {
  ASTEROID_MEDIUM_RADIUS,
  ASTEROID_SMALL_RADIUS,
} from './constants'

// Split an asteroid into smaller ones
export const splitAsteroid = (asteroid: Asteroid): Asteroid[] => {
  if (asteroid.type === 'large') {
    // Large → 2 medium
    return createMediumAsteroids(asteroid)
  } else if (asteroid.type === 'medium') {
    // Medium → 2 small
    return createSmallAsteroids(asteroid)
  }
  // Small → destroyed
  return []
}

// Create 2 medium asteroids from a large one
const createMediumAsteroids = (parent: Asteroid): Asteroid[] => {
  const asteroids: Asteroid[] = []
  
  for (let i = 0; i < 2; i++) {
    // Slight velocity offset (±30° from parent)
    const angleOffset = (i - 0.5) * (Math.PI / 6) // ±30 degrees
    // Rotate velocity vector slightly
    const velocity = rotateVelocity(parent.velocity, angleOffset)
    
    asteroids.push({
      id: `asteroid-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      position: parent.position,
      velocity,
      radius: ASTEROID_MEDIUM_RADIUS,
      type: 'medium',
      rotationSpeed: {
        x: randomRange(-1, 1),
        y: randomRange(-1, 1),
        z: randomRange(-1, 1),
      },
      rotation: {
        x: randomRange(0, Math.PI * 2),
        y: randomRange(0, Math.PI * 2),
        z: randomRange(0, Math.PI * 2),
      },
    })
  }
  
  return asteroids
}

// Create 2 small asteroids from a medium one
const createSmallAsteroids = (parent: Asteroid): Asteroid[] => {
  const asteroids: Asteroid[] = []
  
  for (let i = 0; i < 2; i++) {
    // Slight velocity offset (±30° from parent)
    const angleOffset = (i - 0.5) * (Math.PI / 6) // ±30 degrees
    // Rotate velocity vector slightly
    const velocity = rotateVelocity(parent.velocity, angleOffset)
    
    asteroids.push({
      id: `asteroid-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      position: parent.position,
      velocity,
      radius: ASTEROID_SMALL_RADIUS,
      type: 'small',
      rotationSpeed: {
        x: randomRange(-1, 1),
        y: randomRange(-1, 1),
        z: randomRange(-1, 1),
      },
      rotation: {
        x: randomRange(0, Math.PI * 2),
        y: randomRange(0, Math.PI * 2),
        z: randomRange(0, Math.PI * 2),
      },
    })
  }
  
  return asteroids
}

// Rotate velocity vector by angle around a random axis
const rotateVelocity = (velocity: Vector3, angle: number): Vector3 => {
  const axis = {
    x: Math.random(),
    y: Math.random(),
    z: Math.random(),
  }
  // Normalize axis
  const mag = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z)
  axis.x /= mag
  axis.y /= mag
  axis.z /= mag
  
  // Rodrigues' rotation formula
  const cosAngle = Math.cos(angle)
  const sinAngle = Math.sin(angle)
  
  const dot = velocity.x * axis.x + velocity.y * axis.y + velocity.z * axis.z
  
  return {
    x:
      velocity.x * cosAngle +
      (axis.x * dot) * (1 - cosAngle) +
      (velocity.y * axis.z - velocity.z * axis.y) * sinAngle,
    y:
      velocity.y * cosAngle +
      (axis.y * dot) * (1 - cosAngle) +
      (velocity.z * axis.x - velocity.x * axis.z) * sinAngle,
    z:
      velocity.z * cosAngle +
      (axis.z * dot) * (1 - cosAngle) +
      (velocity.x * axis.y - velocity.y * axis.x) * sinAngle,
  }
}

// Remove an asteroid and spawn its children
export const destroyAsteroid = (
  asteroids: Asteroid[],
  id: string
): { remaining: Asteroid[]; spawned: Asteroid[] } => {
  const asteroidIndex = asteroids.findIndex((a) => a.id === id)
  if (asteroidIndex === -1) {
    return { remaining: asteroids, spawned: [] }
  }
  
  const asteroid = asteroids[asteroidIndex]
  const remaining = asteroids.filter((a) => a.id !== id)
  const spawned = splitAsteroid(asteroid)
  
  return { remaining, spawned }
}
