// Enemy saucer AI: spawning, movement, and firing.
//
// Two classic-Asteroids UFOs:
//  - Large saucer: shows up early, lumbers across the field, fires in roughly
//    random directions. Big and easy, worth a few hundred points.
//  - Small saucer: shows up if you dawdle, and gets progressively faster, more
//    evasive, and more accurate the longer the wave drags on.
//
// NEW: Saucers fly in straight lines only. They change heading on schedule
// but always move in a straight line between turns. Headings are axis-aligned
// in the player's local horizontal frame (forward, backward, left, right).

import { EnemySaucer, EnemyBullet, SaucerType, Vector3 } from './types'
import { randomRange, randomOnSphere, wrapPosition, wrapDelta } from './math'
import {
  PLAY_SPACE_SIZE,
  SAUCER_LARGE_RADIUS,
  SAUCER_SMALL_RADIUS,
  SAUCER_LARGE_SPEED,
  SAUCER_SMALL_SPEED_MIN,
  SAUCER_SMALL_SPEED_MAX,
  SAUCER_SMALL_DELAY,
  SAUCER_ESCALATION_TIME,
  ENEMY_BULLET_SPEED_LARGE,
  ENEMY_BULLET_SPEED_SMALL_MIN,
  ENEMY_BULLET_SPEED_SMALL_MAX,
  ENEMY_BULLET_LIFETIME,
} from './constants'

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const mag = (v: Vector3) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
const norm = (v: Vector3): Vector3 => {
  const m = mag(v) || 1
  return { x: v.x / m, y: v.y / m, z: v.z / m }
}

// 0 (just appeared) -> 1 (maximum nastiness) for the small saucer.
export const getSaucerDifficulty = (waveElapsed: number): number =>
  clamp((waveElapsed - SAUCER_SMALL_DELAY) / SAUCER_ESCALATION_TIME, 0, 1)

// Shortest toroidal vector from a saucer to the ship.
const toShipVector = (from: Vector3, ship: Vector3): Vector3 => ({
  x: wrapDelta(ship.x - from.x, PLAY_SPACE_SIZE),
  y: wrapDelta(ship.y - from.y, PLAY_SPACE_SIZE),
  z: wrapDelta(ship.z - from.z, PLAY_SPACE_SIZE),
})

// Get forward vector from yaw and pitch (same as shipPhysics)
const getForwardVector = (yaw: number, pitch: number): Vector3 => {
  // Simple approximation: forward is (cos(yaw)*cos(pitch), sin(pitch), sin(yaw)*cos(pitch))
  const cosPitch = Math.cos(pitch)
  return {
    x: Math.cos(yaw) * cosPitch,
    y: Math.sin(pitch),
    z: Math.sin(yaw) * cosPitch,
  }
}

// Get right vector (perpendicular to forward in horizontal plane)
const getRightVector = (yaw: number, pitch: number): Vector3 => {
  const cosPitch = Math.cos(pitch)
  // Right is 90 degrees from forward in horizontal plane
  return {
    x: -Math.sin(yaw) * cosPitch,
    y: 0,
    z: Math.cos(yaw) * cosPitch,
  }
}

export const spawnSaucer = (
  type: SaucerType,
  now: number,
  difficulty = 0
): EnemySaucer => {
  const half = PLAY_SPACE_SIZE / 2
  // Enter from a random edge of the cube.
  const edge = randomRange(half * 0.7, half * 0.95)
  const position = randomOnSphere(edge)

  const speed =
    type === 'large'
      ? SAUCER_LARGE_SPEED
      : lerp(SAUCER_SMALL_SPEED_MIN, SAUCER_SMALL_SPEED_MAX, difficulty)

  // On spawn, pick +R or -R (cross the field in front), not a random sphere
  // This ensures saucers enter from the sides and fly across the player's view
  const heading = type === 'large' 
    ? norm({ x: -position.x, y: -position.y, z: -position.z })
    : { x: Math.random() > 0.5 ? 1 : -1, y: 0, z: 0 } // Simple horizontal movement

  return {
    id: `saucer-${type}-${now}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    position,
    velocity: { x: heading.x * speed, y: 0, z: heading.z * speed }, // Flat Y movement
    radius: type === 'large' ? SAUCER_LARGE_RADIUS : SAUCER_SMALL_RADIUS,
    spawnedAt: now,
    nextTurnAt: now + (type === 'large' ? 4000 : 3000), // Longer straight-line segments
    // Grace period before the saucer opens fire.
    nextFireAt: now + (type === 'large' ? 2800 : 2200),
  }
}

// Pick a new velocity for a saucer that's changing heading.
// Saucers fly in straight lines with axis-aligned headings in player's local frame.
const chooseVelocity = (
  saucer: EnemySaucer,
  ship: Vector3,
  difficulty: number,
  shipYaw: number,
  shipPitch: number
): Vector3 => {
  const toShip = toShipVector(saucer.position, ship)
  const toShipN = norm(toShip)
  const forward = getForwardVector(shipYaw, shipPitch)
  const right = getRightVector(shipYaw, shipPitch)
  
  // Compute dot products to determine saucer position relative to player
  const dotForward = toShipN.x * forward.x + toShipN.y * forward.y + toShipN.z * forward.z
  // dotRight is computed but not used - saucer position determines allowed directions
  
  // Determine allowed directions based on saucer position
  let allowedDirs: Vector3[] = []
  
  if (dotForward > 0) {
    // Saucer is in forward hemisphere - never fly behind
    // Prefer sliding left/right (crossing the view), forward is OK
    allowedDirs = [
      right,           // +R (slide right)
      { x: -right.x, y: 0, z: -right.z },  // -R (slide left)
      forward,         // +F (forward)
    ]
  } else {
    // Saucer is behind - may choose +F to come around in front
    allowedDirs = [
      forward,         // +F (come around in front)
      right,           // +R
      { x: -right.x, y: 0, z: -right.z },  // -R
    ]
  }
  
  // Pick a random allowed direction
  const dir = allowedDirs[Math.floor(Math.random() * allowedDirs.length)]
  
  const speed = saucer.type === 'large'
    ? SAUCER_LARGE_SPEED
    : lerp(SAUCER_SMALL_SPEED_MIN, SAUCER_SMALL_SPEED_MAX, difficulty)
  
  return { x: dir.x * speed, y: 0, z: dir.z * speed } // Flat Y movement
}

// Build the bullet a saucer fires this frame.
const fireBullet = (
  saucer: EnemySaucer,
  ship: Vector3,
  difficulty: number,
  now: number
): EnemyBullet => {
  let dir: Vector3
  let speed: number

  if (saucer.type === 'large') {
    // Inaccurate: fire in a random direction (slightly biased toward the ship).
    const toShip = norm(toShipVector(saucer.position, ship))
    const rnd = randomOnSphere(1)
    dir = norm({
      x: toShip.x * 0.4 + rnd.x * 0.6,
      y: toShip.y * 0.4 + rnd.y * 0.6,
      z: toShip.z * 0.4 + rnd.z * 0.6,
    })
    speed = ENEMY_BULLET_SPEED_LARGE
  } else {
    // Aimed at the ship, with an error cone that tightens as difficulty rises
    // (but never becomes pinpoint, so it stays dodgeable).
    const aim = norm(toShipVector(saucer.position, ship))
    const errorRad = lerp(0.55, 0.16, difficulty) // ~32deg -> ~9deg
    const jitter = randomOnSphere(Math.tan(errorRad))
    dir = norm({ x: aim.x + jitter.x, y: aim.y + jitter.y, z: aim.z + jitter.z })
    speed = lerp(ENEMY_BULLET_SPEED_SMALL_MIN, ENEMY_BULLET_SPEED_SMALL_MAX, difficulty)
  }

  const muzzle = saucer.radius + 1
  return {
    id: `ebullet-${now}-${Math.random().toString(36).slice(2, 8)}`,
    position: {
      x: saucer.position.x + dir.x * muzzle,
      y: saucer.position.y + dir.y * muzzle,
      z: saucer.position.z + dir.z * muzzle,
    },
    velocity: { x: dir.x * speed, y: dir.y * speed, z: dir.z * speed },
    lifetime: ENEMY_BULLET_LIFETIME,
    fromSmall: saucer.type === 'small',
  }
}

export interface EnemyUpdate {
  enemies: EnemySaucer[]
  newBullets: EnemyBullet[]
  fired: boolean
}

export const updateEnemies = (
  enemies: EnemySaucer[],
  ship: { position: Vector3; yaw: number; pitch: number },
  deltaTime: number,
  now: number,
  waveElapsed: number
): EnemyUpdate => {
  const difficulty = getSaucerDifficulty(waveElapsed)
  const newBullets: EnemyBullet[] = []
  let fired = false

  const updated = enemies.map((saucer) => {
    let velocity = saucer.velocity
    let nextTurnAt = saucer.nextTurnAt
    let nextFireAt = saucer.nextFireAt

    // Change heading on schedule.
    if (now >= nextTurnAt) {
      velocity = chooseVelocity(saucer, ship.position, difficulty, ship.yaw, ship.pitch)
      const turnGap =
        saucer.type === 'large'
          ? randomRange(4000, 6000)
          : lerp(3000, 2000, difficulty) * randomRange(0.85, 1.15)
      nextTurnAt = now + turnGap
    }

    // Fire on schedule.
    if (now >= nextFireAt) {
      newBullets.push(fireBullet(saucer, ship.position, difficulty, now))
      fired = true
      const fireGap =
        saucer.type === 'large'
          ? randomRange(2800, 4000)
          : lerp(2800, 1400, difficulty) * randomRange(0.85, 1.15)
      nextFireAt = now + fireGap
    }

    const moved = {
      x: saucer.position.x + velocity.x * deltaTime,
      y: saucer.position.y + velocity.y * deltaTime,
      z: saucer.position.z + velocity.z * deltaTime,
    }

    return {
      ...saucer,
      position: wrapPosition(moved, PLAY_SPACE_SIZE),
      velocity,
      nextTurnAt,
      nextFireAt,
    }
  })

  return { enemies: updated, newBullets, fired }
}

export const updateEnemyBullets = (
  bullets: EnemyBullet[],
  deltaTime: number
): EnemyBullet[] =>
  bullets
    .map((b) => ({
      ...b,
      lifetime: b.lifetime - deltaTime,
      position: wrapPosition(
        {
          x: b.position.x + b.velocity.x * deltaTime,
          y: b.position.y + b.velocity.y * deltaTime,
          z: b.position.z + b.velocity.z * deltaTime,
        },
        PLAY_SPACE_SIZE
      ),
    }))
    .filter((b) => b.lifetime > 0)
