// Wave generation logic

import { Vector3 } from './types'
import { randomRange, randomOnSphere } from './math'
import {
  ASTEROID_LARGE_RADIUS,
  ASTEROID_MIN_SPEED,
  ASTEROID_MAX_SPEED,
  PLAY_SPACE_SIZE,
} from './constants'

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
  const half = PLAY_SPACE_SIZE / 2

  for (let i = 0; i < count; i++) {
    // Spawn out toward the edges of the compact zone (but inside it), so rocks
    // start away from the ship and drift inward.
    const spawnRadius = randomRange(half * 0.6, half * 0.92)
    const position = randomOnSphere(spawnRadius)

    // Head roughly toward the origin (where the ship starts) with some spread,
    // so if you sit still, something will eventually reach you.
    const speed = randomRange(ASTEROID_MIN_SPEED, ASTEROID_MAX_SPEED)
    const inward = {
      x: -position.x / spawnRadius,
      y: -position.y / spawnRadius,
      z: -position.z / spawnRadius,
    }
    const jitter = randomOnSphere(1)
    const velocity = {
      x: (inward.x * 0.75 + jitter.x * 0.25) * speed,
      y: (inward.y * 0.75 + jitter.y * 0.25) * speed,
      z: (inward.z * 0.75 + jitter.z * 0.25) * speed,
    }

    asteroids.push({
      id: `asteroid-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      position,
      velocity,
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
