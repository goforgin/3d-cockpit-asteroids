// Ship physics and movement logic

import { Ship } from './types'
import { Vector3 } from './types'
import { inputManager } from './input'
import {
  ROTATION_YAW_SPEED,
  ROTATION_PITCH_SPEED,
  THRUST_ACCEL,
  MAX_SPEED,
  FRICTION,
  PLAY_SPACE_SIZE,
} from './constants'
import { wrapPosition, vectorAdd, vectorMult, vectorNormalize } from './math'

// Compute forward vector from yaw/pitch (Three.js: ship nose = -Z local)
export const getForwardVector = (yaw: number, pitch: number): Vector3 => {
  // Yaw rotation around Y axis, pitch around X axis
  // Forward is -Z in local space
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  
  // Transform -Z local vector by rotation
  // After yaw: x' = -z*sin(yaw), z' = z*cos(yaw)
  // After pitch: y' = y*cos(pitch) - z'*sin(pitch), z'' = y*sin(pitch) + z'*cos(pitch)
  // For -Z local: x=0, y=0, z=-1
  // After yaw: x=0, y=0, z=1
  // After pitch: x=0, y=-sin(pitch), z=cos(pitch)
  // Then apply yaw: x=-sin(yaw)*cos(pitch), y=-sin(pitch), z=cos(yaw)*cos(pitch)
  
  return {
    x: -sy * cp,
    y: -sp,
    z: cy * cp,
  }
}

export const updateShipPhysics = (ship: Ship, deltaTime: number): Ship => {
  // Get input state
  const left = inputManager.isKeyHeld('arrowleft')
  const right = inputManager.isKeyHeld('arrowright')
  const up = inputManager.isKeyHeld('arrowup')
  const down = inputManager.isKeyHeld('arrowdown')
  const thrust = inputManager.isKeyHeld('alt')
  
  // Create new ship object (immutable update)
  const newShip: Ship = {
    ...ship,
    rotation: { ...ship.rotation },
    position: { ...ship.position },
    velocity: { ...ship.velocity },
  }
  
  // Rotation (arrow keys, continuous while held)
  if (left) {
    newShip.rotation.yaw += ROTATION_YAW_SPEED * deltaTime
  }
  if (right) {
    newShip.rotation.yaw -= ROTATION_YAW_SPEED * deltaTime
  }
  if (up) {
    newShip.rotation.pitch += ROTATION_PITCH_SPEED * deltaTime
  }
  if (down) {
    newShip.rotation.pitch -= ROTATION_PITCH_SPEED * deltaTime
  }
  
  // Clamp pitch to ±80° (~±1.4 rad) to prevent gimbal flip
  const maxPitch = 1.4
  if (newShip.rotation.pitch > maxPitch) newShip.rotation.pitch = maxPitch
  if (newShip.rotation.pitch < -maxPitch) newShip.rotation.pitch = -maxPitch
  
  // Thrust (Alt held)
  if (thrust) {
    const forward = getForwardVector(newShip.rotation.yaw, newShip.rotation.pitch)
    newShip.velocity = vectorAdd(newShip.velocity, vectorMult(forward, THRUST_ACCEL * deltaTime))
    
    // Cap speed at MAX_SPEED
    const speed = Math.sqrt(
      newShip.velocity.x * newShip.velocity.x +
      newShip.velocity.y * newShip.velocity.y +
      newShip.velocity.z * newShip.velocity.z
    )
    
    if (speed > MAX_SPEED) {
      newShip.velocity = vectorMult(vectorNormalize(newShip.velocity), MAX_SPEED)
    }
  }
  
  // Friction (always)
  newShip.velocity.x *= FRICTION
  newShip.velocity.y *= FRICTION
  newShip.velocity.z *= FRICTION
  
  // Position update
  newShip.position = vectorAdd(newShip.position, vectorMult(newShip.velocity, deltaTime))
  
  // Wrap position at boundaries
  newShip.position = wrapPosition(newShip.position, PLAY_SPACE_SIZE)
  
  return newShip
}
