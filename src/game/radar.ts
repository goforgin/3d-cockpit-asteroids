// Radar utility functions for converting world positions to radar blip coordinates

import { Vector3 } from './types'
import { Asteroid } from './types'
import { wrapDelta } from './math'
import { PLAY_SPACE_SIZE } from './constants'

export interface RadarBlip {
  id: string
  x: number       // 0–1 normalized, 0.5 = center
  y: number       // 0–1 normalized, 0.5 = center
  size: 'large' | 'medium' | 'small'
  elevation: 'high' | 'level' | 'low'  // based on local Y offset
}

/**
 * Transform world position to ship-local space
 * @param worldPos World position
 * @param shipPosition Ship position
 * @param shipYaw Ship yaw rotation (around Y axis)
 * @param shipPitch Ship pitch rotation (around X axis)
 * @returns Local position relative to ship
 */
const transformToWorldToLocal = (
  worldPos: Vector3,
  shipPosition: Vector3,
  shipYaw: number,
  shipPitch: number
): Vector3 => {
  // Translate to ship-relative position using the shortest wrap distance, so a
  // rock just past the left edge shows up entering from the right, etc.
  const relativeX = wrapDelta(worldPos.x - shipPosition.x, PLAY_SPACE_SIZE)
  const relativeY = wrapDelta(worldPos.y - shipPosition.y, PLAY_SPACE_SIZE)
  const relativeZ = wrapDelta(worldPos.z - shipPosition.z, PLAY_SPACE_SIZE)
  
  // Apply inverse yaw rotation (around Y axis)
  // To transform from world to ship space, we rotate by -yaw
  const cy = Math.cos(-shipYaw)
  const sy = Math.sin(-shipYaw)
  
  // Rotate around Y: x' = x*cos + z*sin, z' = -x*sin + z*cos
  const afterYawX = relativeX * cy - relativeZ * sy
  const afterYawZ = relativeX * sy + relativeZ * cy
  const afterYawY = relativeY
  
  // Apply inverse pitch rotation (around X axis)
  // To transform from world to ship space, we rotate by -pitch
  const cp = Math.cos(-shipPitch)
  const sp = Math.sin(-shipPitch)
  
  // Rotate around X: y' = y*cos - z*sin, z' = y*sin + z*cos
  const finalY = afterYawY * cp - afterYawZ * sp
  const finalZ = afterYawY * sp + afterYawZ * cp
  const finalX = afterYawX
  
  return { x: finalX, y: finalY, z: finalZ }
}

/**
 * Convert world positions to radar blip coordinates
 * @param shipPosition Ship position
 * @param shipYaw Ship yaw rotation
 * @param shipPitch Ship pitch rotation
 * @param asteroids List of asteroids
 * @param worldHalfSize Half the play space size (for normalization)
 * @returns Array of radar blips
 */
export function getRadarBlips(
  shipPosition: Vector3,
  shipYaw: number,
  shipPitch: number,
  asteroids: Asteroid[],
  worldHalfSize: number
): RadarBlip[] {
  const blips: RadarBlip[] = []
  
  for (const asteroid of asteroids) {
    // Transform asteroid position to ship-local space
    const localPos = transformToWorldToLocal(
      asteroid.position,
      shipPosition,
      shipYaw,
      shipPitch
    )
    
    // Radar uses ship-local X (right) and local Z (forward/back) plane
    // Forward = negative Z in local space (ship faces -Z)
    // But for radar, we want forward = top of screen (higher Y value in normalized coords)
    
    // Normalize coordinates to 0-1 range
    // x: -worldHalfSize to +worldHalfSize -> 0 to 1
    // y: -worldHalfSize to +worldHalfSize -> 0 to 1 (inverted because screen Y is down)
    let blipX = 0.5 + (localPos.x / worldHalfSize) * 0.5
    let blipY = 0.5 - (localPos.z / worldHalfSize) * 0.5
    
    // Clamp to 0-1 range
    blipX = Math.max(0, Math.min(1, blipX))
    blipY = Math.max(0, Math.min(1, blipY))
    
    // Elevation indicator based on local Y (up/down relative to ship)
    let elevation: 'high' | 'level' | 'low' = 'level'
    if (localPos.y > 20) {
      elevation = 'high'
    } else if (localPos.y < -20) {
      elevation = 'low'
    }
    
    blips.push({
      id: asteroid.id,
      x: blipX,
      y: blipY,
      size: asteroid.type,
      elevation,
    })
  }
  
  return blips
}
