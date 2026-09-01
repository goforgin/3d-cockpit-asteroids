// Enemy saucer AI: spawning, movement, and firing.
//
// Two classic-Asteroids UFOs:
//  - Large saucer: shows up early, lumbers across the field, fires in roughly
//    random directions. Big and easy, worth a few hundred points.
//  - Small saucer: shows up if you dawdle, and gets progressively faster, more
//    evasive, and more accurate the longer the wave drags on.

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

  // Initially head roughly across the field (toward the far side).
  const heading = norm({ x: -position.x, y: -position.y, z: -position.z })

  return {
    id: `saucer-${type}-${now}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    position,
    velocity: { x: heading.x * speed, y: heading.y * speed, z: heading.z * speed },
    radius: type === 'large' ? SAUCER_LARGE_RADIUS : SAUCER_SMALL_RADIUS,
    spawnedAt: now,
    nextTurnAt: now + (type === 'large' ? 1600 : 700),
    nextFireAt: now + (type === 'large' ? 1800 : 1200),
  }
}

// Pick a new velocity for a saucer that's changing heading.
const chooseVelocity = (
  saucer: EnemySaucer,
  ship: Vector3,
  difficulty: number
): Vector3 => {
  if (saucer.type === 'large') {
    // Mostly keep drifting, with a gentle random jog.
    const jog = randomOnSphere(1)
    const v = norm({
      x: saucer.velocity.x + jog.x * 8,
      y: saucer.velocity.y + jog.y * 8,
      z: saucer.velocity.z + jog.z * 8,
    })
    return { x: v.x * SAUCER_LARGE_SPEED, y: v.y * SAUCER_LARGE_SPEED, z: v.z * SAUCER_LARGE_SPEED }
  }

  // Small saucer: strafe perpendicular to the player line (evasive) plus a bit
  // of range-keeping so it hovers at a threatening mid distance.
  const toShip = toShipVector(saucer.position, ship)
  const dist = mag(toShip)
  const toShipN = norm(toShip)
  const rnd = randomOnSphere(1)
  // Perpendicular component (cross product) => strafing motion.
  const strafe = norm({
    x: toShipN.y * rnd.z - toShipN.z * rnd.y,
    y: toShipN.z * rnd.x - toShipN.x * rnd.z,
    z: toShipN.x * rnd.y - toShipN.y * rnd.x,
  })
  // Keep a comfortable engagement range.
  const idealRange = PLAY_SPACE_SIZE * 0.28
  const rangeSign = dist > idealRange ? 1 : -1
  const dir = norm({
    x: strafe.x * 0.8 + toShipN.x * rangeSign * 0.35 + rnd.x * 0.2,
    y: strafe.y * 0.8 + toShipN.y * rangeSign * 0.35 + rnd.y * 0.2,
    z: strafe.z * 0.8 + toShipN.z * rangeSign * 0.35 + rnd.z * 0.2,
  })
  const speed = lerp(SAUCER_SMALL_SPEED_MIN, SAUCER_SMALL_SPEED_MAX, difficulty)
  return { x: dir.x * speed, y: dir.y * speed, z: dir.z * speed }
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
    // Aimed at the ship, with an error cone that tightens as difficulty rises.
    const aim = norm(toShipVector(saucer.position, ship))
    const errorRad = lerp(0.45, 0.04, difficulty) // ~26deg -> ~2deg
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
  ship: Vector3,
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
      velocity = chooseVelocity(saucer, ship, difficulty)
      const turnGap =
        saucer.type === 'large'
          ? randomRange(1200, 2200)
          : lerp(1000, 380, difficulty) * randomRange(0.8, 1.2)
      nextTurnAt = now + turnGap
    }

    // Fire on schedule.
    if (now >= nextFireAt) {
      newBullets.push(fireBullet(saucer, ship, difficulty, now))
      fired = true
      const fireGap =
        saucer.type === 'large'
          ? randomRange(2000, 3200)
          : lerp(2000, 820, difficulty) * randomRange(0.85, 1.15)
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
