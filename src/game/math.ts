// Math utilities for game logic

import { Vector3 } from './types'

export const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min
}

export const randomOnSphere = (radius: number): Vector3 => {
  const u = Math.random()
  const v = Math.random()
  const theta = 2 * Math.PI * u
  const phi = Math.acos(2 * v - 1)
  const x = radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.sin(phi) * Math.sin(theta)
  const z = radius * Math.cos(phi)
  return { x, y, z }
}

export const wrapPosition = (position: Vector3, size: number): Vector3 => {
  const halfSize = size / 2
  const wrap = (v: number) => {
    if (v > halfSize) return v - size
    if (v < -halfSize) return v + size
    return v
  }
  return { x: wrap(position.x), y: wrap(position.y), z: wrap(position.z) }
}

// Map a single-axis difference into the shortest wrapped distance on a torus
// of the given size, i.e. into the range [-size/2, size/2]. Used so a rock near
// the opposite edge is treated as "just across the boundary" rather than far.
export const wrapDelta = (delta: number, size: number): number => {
  const half = size / 2
  let d = delta
  if (d > half) d -= size
  else if (d < -half) d += size
  return d
}

// Shortest vector from a -> b accounting for toroidal wrap.
export const wrappedDelta = (a: Vector3, b: Vector3, size: number): Vector3 => ({
  x: wrapDelta(b.x - a.x, size),
  y: wrapDelta(b.y - a.y, size),
  z: wrapDelta(b.z - a.z, size),
})

export const distance = (a: Vector3, b: Vector3): number => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

// Distance between two points on the toroidal play field (shortest wrap).
export const wrappedDistance = (a: Vector3, b: Vector3, size: number): number => {
  const d = wrappedDelta(a, b, size)
  return Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z)
}

export const sphereIntersects = (a: Vector3, ra: number, b: Vector3, rb: number): boolean => {
  return distance(a, b) < (ra + rb)
}

export const vectorAdd = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
})

export const vectorSub = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
})

export const vectorMult = (v: Vector3, s: number): Vector3 => ({
  x: v.x * s,
  y: v.y * s,
  z: v.z * s,
})

export const vectorNormalize = (v: Vector3): Vector3 => {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
  if (mag === 0) return { x: 0, y: 0, z: 0 }
  return vectorMult(v, 1 / mag)
}
