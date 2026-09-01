// Ship physics and movement logic

import * as THREE from 'three'
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

// Reusable temporaries so we don't allocate every frame.
const _forwardEuler = new THREE.Euler()
const _forwardVec = new THREE.Vector3()

// Compute the ship's forward direction (where the cockpit/crosshair points).
//
// This MUST match exactly how the camera is oriented in Ship.tsx, otherwise
// lasers and thrust won't line up with the crosshair. The camera is rotated
// with `camera.rotation.set(pitch, yaw, 0, 'YXZ')`, so we derive forward by
// applying the identical Euler to Three.js' default camera-forward (-Z).
export const getForwardVector = (yaw: number, pitch: number): Vector3 => {
  _forwardEuler.set(pitch, yaw, 0, 'YXZ')
  _forwardVec.set(0, 0, -1).applyEuler(_forwardEuler)
  return { x: _forwardVec.x, y: _forwardVec.y, z: _forwardVec.z }
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
