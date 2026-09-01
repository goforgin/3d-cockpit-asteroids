// Asteroid physics and movement logic

import { Asteroid } from './types'
import { wrapPosition } from './math'

export const updateAsteroids = (
  asteroids: Asteroid[],
  deltaTime: number
): Asteroid[] => {
  return asteroids.map((asteroid) => {
    // Move asteroid by velocity
    const newPosition = {
      x: asteroid.position.x + asteroid.velocity.x * deltaTime,
      y: asteroid.position.y + asteroid.velocity.y * deltaTime,
      z: asteroid.position.z + asteroid.velocity.z * deltaTime,
    }
    
    // Apply wrap at boundaries
    const wrappedPosition = wrapPosition(newPosition, 400) // PLAY_SPACE_SIZE = 400
    
    // Update rotation
    const newRotation = {
      x: asteroid.rotation.x + asteroid.rotationSpeed.x * deltaTime,
      y: asteroid.rotation.y + asteroid.rotationSpeed.y * deltaTime,
      z: asteroid.rotation.z + asteroid.rotationSpeed.z * deltaTime,
    }
    
    return {
      ...asteroid,
      position: wrappedPosition,
      rotation: newRotation,
    }
  })
}
