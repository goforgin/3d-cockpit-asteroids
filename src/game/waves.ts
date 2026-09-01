// Wave generation logic

import { Vector3 } from './types'
import { randomRange, randomOnSphere } from './math'
import { ASTEROID_LARGE_RADIUS } from './constants'

export interface SpawnedAsteroid {
  id: string
  position: Vector3
  velocity: Vector3
  radius: number
  type: 'large' | 'medium' | 'small'
  rotationSpeed: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
}

// Get asteroid count for a given wave (classic table)
export const getWaveLargeCount = (waveNumber: number): number => {
  if (waveNumber === 1) return 4
  if (waveNumber === 2) return 6
  if (waveNumber === 3) return 8
  // Wave 4+: min(4 + (wave-1)*2, 12)
  return Math.min(4 + (waveNumber - 1) * 2, 12)
}

export const generateWave = (waveNumber: number): SpawnedAsteroid[] => {
  const count = getWaveLargeCount(waveNumber)
  const asteroids: SpawnedAsteroid[] = []
  
  for (let i = 0; i < count; i++) {
    asteroids.push({
      id: `asteroid-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      position: randomOnSphere(150), // Spawn on sphere shell radius 150
      velocity: randomOnSphere(randomRange(5, 15)), // Random direction, magnitude 5-15
      radius: ASTEROID_LARGE_RADIUS,
      type: 'large',
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
