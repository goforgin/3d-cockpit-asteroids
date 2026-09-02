// Asteroid splitting: children keep the parent's heading (classic Asteroids).
// If the rock was closing on the ship, the fragments keep coming at you with
// only a small left/right kick — shooting a rock in your face is dangerous.

import { Asteroid, Vector3 } from './types'
import { randomRange, wrappedDelta } from './math'
import {
  ASTEROID_MEDIUM_RADIUS,
  ASTEROID_SMALL_RADIUS,
  PLAY_SPACE_SIZE,
} from './constants'

export const splitAsteroid = (asteroid: Asteroid, shipPosition: Vector3): Asteroid[] => {
  if (asteroid.type === 'large') return createChildren(asteroid, shipPosition, 'medium', ASTEROID_MEDIUM_RADIUS)
  if (asteroid.type === 'medium') return createChildren(asteroid, shipPosition, 'small', ASTEROID_SMALL_RADIUS)
  return []
}

const mag = (v: Vector3) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)

const createChildren = (
  parent: Asteroid,
  shipPosition: Vector3,
  type: 'medium' | 'small',
  radius: number
): Asteroid[] => {
  const parentSpeed = mag(parent.velocity) || 1
  const toShip = wrappedDelta(parent.position, shipPosition, PLAY_SPACE_SIZE)
  const toShipMag = mag(toShip) || 1
  const toShipN = { x: toShip.x / toShipMag, y: toShip.y / toShipMag, z: toShip.z / toShipMag }

  // Sideways split axis: perpendicular to the inbound direction.
  const tmp = Math.abs(toShipN.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }
  const side = {
    x: toShipN.y * tmp.z - toShipN.z * tmp.y,
    y: toShipN.z * tmp.x - toShipN.x * tmp.z,
    z: toShipN.x * tmp.y - toShipN.y * tmp.x,
  }
  const sideMag = mag(side) || 1
  const sideN = { x: side.x / sideMag, y: side.y / sideMag, z: side.z / sideMag }

  const closing = parent.velocity.x * toShipN.x + parent.velocity.y * toShipN.y + parent.velocity.z * toShipN.z
  const childSpeed = Math.max(parentSpeed * 1.25, closing * 1.15)

  return [1, -1].map((sign, i) => {
    const kick = childSpeed * 0.28 * sign
    const inbound = Math.max(closing, childSpeed * 0.75)
    const velocity = {
      x: toShipN.x * inbound + sideN.x * kick + parent.velocity.x * 0.35,
      y: toShipN.y * inbound + sideN.y * kick + parent.velocity.y * 0.35,
      z: toShipN.z * inbound + sideN.z * kick + parent.velocity.z * 0.35,
    }
    const offset = parent.radius * 0.45 * sign
    return {
      id: `asteroid-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: parent.position.x + sideN.x * offset,
        y: parent.position.y + sideN.y * offset,
        z: parent.position.z + sideN.z * offset,
      },
      velocity,
      radius,
      type,
      rotationSpeed: {
        x: randomRange(-1.5, 1.5),
        y: randomRange(-1.5, 1.5),
        z: randomRange(-1.5, 1.5),
      },
      rotation: {
        x: randomRange(0, Math.PI * 2),
        y: randomRange(0, Math.PI * 2),
        z: randomRange(0, Math.PI * 2),
      },
    }
  })
}

export const destroyAsteroid = (
  asteroids: Asteroid[],
  id: string,
  shipPosition: Vector3
): { remaining: Asteroid[]; spawned: Asteroid[] } => {
  const asteroid = asteroids.find((a) => a.id === id)
  if (!asteroid) {
    return { remaining: asteroids, spawned: [] }
  }
  return {
    remaining: asteroids.filter((a) => a.id !== id),
    spawned: splitAsteroid(asteroid, shipPosition),
  }
}
