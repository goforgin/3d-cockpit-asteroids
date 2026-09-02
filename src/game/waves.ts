// Wave generation logic

import { Vector3 } from './types'
import { randomRange, randomOnSphere, vectorCross, vectorNormalize } from './math'
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
    // Spawn out near the edges so nothing is sitting on the cockpit.
    const spawnRadius = randomRange(half * 0.84, half * 0.98)
    let position = randomOnSphere(spawnRadius)

    // Wave 1: camera looks down -Z. Flip anything in the forward hemisphere
    // behind the ship so a rock isn't filling the windshield on the first frame.
    if (waveNumber === 1 && position.z < 10) {
      position = { ...position, z: Math.abs(position.z) + 14 }
      const mag = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2) || 1
      position = {
        x: (position.x / mag) * spawnRadius,
        y: (position.y / mag) * spawnRadius,
        z: (position.z / mag) * spawnRadius,
      }
    }

    const inward = vectorNormalize({
      x: -position.x,
      y: -position.y,
      z: -position.z,
    })
    const helper = Math.abs(inward.y) < 0.9
      ? { x: 0, y: 1, z: 0 }
      : { x: 1, y: 0, z: 0 }
    const tangent = vectorNormalize(vectorCross(inward, helper))

    // Mostly orbit so rocks close over several seconds instead of ramming spawn.
    // Later waves pull inward harder so sitting still is still dangerous.
    const inboundMix = waveNumber === 1 ? 0.18 : 0.42
    const dir = vectorNormalize({
      x: tangent.x * (1 - inboundMix) + inward.x * inboundMix,
      y: tangent.y * (1 - inboundMix) + inward.y * inboundMix,
      z: tangent.z * (1 - inboundMix) + inward.z * inboundMix,
    })
    const speed = randomRange(ASTEROID_MIN_SPEED, ASTEROID_MAX_SPEED)
    const velocity = {
      x: dir.x * speed,
      y: dir.y * speed,
      z: dir.z * speed,
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
