// Procedural asteroid generation utilities

import * as THREE from 'three'

/**
 * Generate a seeded random number based on a string seed
 * Uses a simple hash function to create deterministic randomness
 */
export function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  // Simple LCG for pseudo-random generation
  const x = Math.sin(hash) * 10000
  return x - Math.floor(x)
}

/**
 * Displace vertices of a geometry to create irregular asteroid shape
 * @param geometry Three.js BufferGeometry
 * @param seed String seed for deterministic randomness
 * @param amount Maximum displacement amount
 */
export function displaceGeometry(geometry: THREE.BufferGeometry, seed: string, amount: number): void {
  const positionAttribute = geometry.attributes.position
  
  // Create a seeded random function for this geometry
  const random = () => seededRandom(seed + Math.random())
  
  // Displace each vertex
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i)
    const y = positionAttribute.getY(i)
    const z = positionAttribute.getZ(i)
    
    // Calculate vertex normal direction
    const length = Math.sqrt(x * x + y * y + z * z)
    const nx = x / length
    const ny = y / length
    const nz = z / length
    
    // Apply random displacement along normal
    const displacement = (random() - 0.5) * 2 * amount
    positionAttribute.setX(i, x + nx * displacement)
    positionAttribute.setY(i, y + ny * displacement)
    positionAttribute.setZ(i, z + nz * displacement)
  }
  
  // Recompute normals after displacement
  geometry.computeVertexNormals()
}

/**
 * Get color variation based on asteroid type
 */
export function getAsteroidColor(type: 'large' | 'medium' | 'small'): string {
  switch (type) {
    case 'large':
      return '#5a4a3a' // Darker, more weathered
    case 'medium':
      return '#6b5a4a' // Medium gray
    case 'small':
      return '#7a6a5a' // Lighter, more jagged
    default:
      return '#6b5a4a'
  }
}
