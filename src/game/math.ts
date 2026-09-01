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
  const wrapped: Vector3 = { ...position }
  
  if (wrapped.x > halfSize) wrapped.x = -halfSize
  else if (wrapped.x < -halfSize) wrapped.x = halfSize
  
  if (wrapped.y > halfSize) wrapped.y = -halfSize
  else if (wrapped.y < -halfSize) wrapped.y = halfSize
  
  if (wrapped.z > halfSize) wrapped.z = -halfSize
  else if (wrapped.z < -halfSize) wrapped.z = halfSize
  
  return wrapped
}

export const distance = (a: Vector3, b: Vector3): number => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
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
