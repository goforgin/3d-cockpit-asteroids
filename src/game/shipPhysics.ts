// Ship physics and movement logic

import * as THREE from 'three'
import { Ship } from './types'
import { Vector3 } from './types'
import { inputManager } from './input'
import {
  ROTATION_YAW_SPEED,
  ROTATION_PITCH_SPEED,
  ROTATION_ACCEL,
  ROTATION_DAMPING,
  THRUST_ACCEL,
  MAX_SPEED,
  LINEAR_DRAG,
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

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

export const updateShipPhysics = (ship: Ship, deltaTime: number): Ship => {
  // Get input state
  const left = inputManager.isKeyHeld('arrowleft')
  const right = inputManager.isKeyHeld('arrowright')
  const up = inputManager.isKeyHeld('arrowup')
  const down = inputManager.isKeyHeld('arrowdown')
  const thrust = inputManager.isKeyHeld('alt')

  // Defensive default so older ship objects without angularVelocity don't NaN.
  const prevAngular = ship.angularVelocity ?? { yaw: 0, pitch: 0 }

  // Create new ship object (immutable update)
  const newShip: Ship = {
    ...ship,
    rotation: { ...ship.rotation },
    angularVelocity: { ...prevAngular },
    position: { ...ship.position },
    velocity: { ...ship.velocity },
  }

  // --- Joystick-style rotation ---
  // While a key is held the angular velocity ramps up toward its cap; when
  // released it decays smoothly back to zero. This removes the twitchy feel of
  // instant snapping and emulates pushing/releasing a joystick.
  const yawInput = (left ? 1 : 0) - (right ? 1 : 0)
  const pitchInput = (up ? 1 : 0) - (down ? 1 : 0)

  if (yawInput !== 0) {
    newShip.angularVelocity.yaw += yawInput * ROTATION_ACCEL * deltaTime
  } else {
    newShip.angularVelocity.yaw -=
      newShip.angularVelocity.yaw * Math.min(1, ROTATION_DAMPING * deltaTime)
  }
  newShip.angularVelocity.yaw = clamp(
    newShip.angularVelocity.yaw,
    -ROTATION_YAW_SPEED,
    ROTATION_YAW_SPEED
  )

  if (pitchInput !== 0) {
    newShip.angularVelocity.pitch += pitchInput * ROTATION_ACCEL * deltaTime
  } else {
    newShip.angularVelocity.pitch -=
      newShip.angularVelocity.pitch * Math.min(1, ROTATION_DAMPING * deltaTime)
  }
  newShip.angularVelocity.pitch = clamp(
    newShip.angularVelocity.pitch,
    -ROTATION_PITCH_SPEED,
    ROTATION_PITCH_SPEED
  )

  // Apply angular velocity to orientation
  newShip.rotation.yaw += newShip.angularVelocity.yaw * deltaTime
  newShip.rotation.pitch += newShip.angularVelocity.pitch * deltaTime

  // Clamp pitch to ±80° (~±1.4 rad) and stop pitching further at the limit
  const maxPitch = 1.4
  if (newShip.rotation.pitch > maxPitch) {
    newShip.rotation.pitch = maxPitch
    if (newShip.angularVelocity.pitch > 0) newShip.angularVelocity.pitch = 0
  }
  if (newShip.rotation.pitch < -maxPitch) {
    newShip.rotation.pitch = -maxPitch
    if (newShip.angularVelocity.pitch < 0) newShip.angularVelocity.pitch = 0
  }

  // --- Thrust (Alt held) ---
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

  // --- Gentle drag (deltaTime-based so it's frame-rate independent) ---
  const dragFactor = Math.max(0, 1 - LINEAR_DRAG * deltaTime)
  newShip.velocity.x *= dragFactor
  newShip.velocity.y *= dragFactor
  newShip.velocity.z *= dragFactor

  // Position update
  newShip.position = vectorAdd(newShip.position, vectorMult(newShip.velocity, deltaTime))

  // Wrap position at boundaries
  newShip.position = wrapPosition(newShip.position, PLAY_SPACE_SIZE)

  return newShip
}
