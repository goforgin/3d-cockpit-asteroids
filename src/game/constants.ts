// Game constants - tunable numbers for gameplay balance

// Rotation speeds (radians per second)
export const ROTATION_YAW_SPEED = Math.PI          // 180°/sec
export const ROTATION_PITCH_SPEED = Math.PI * 0.67 // 120°/sec

// Thrust and movement
export const THRUST_ACCEL = 25                     // units/s²
export const MAX_SPEED = 40                        // units/s
export const FRICTION = 0.98                       // per frame at 60fps

// Combat
export const FIRE_RATE = 4                         // shots per second
export const LASER_SPEED = 120                    // units per second
export const LASER_LIFETIME = 1.5                 // seconds
export const MAX_LASERS = 4                       // max active lasers

// Shield and special
export const SHIELD_HITS_PER_SHIP = 3             // total hits absorbed per life
export const SHIELD_DURATION = 2.0                // seconds active per Z press
export const HYPERSPACE_COOLDOWN = 5.0            // seconds
export const RESPAWN_INVULN = 3.0                 // seconds

// Play space
export const PLAY_SPACE_SIZE = 400                // 400x400x400 units
export const SHIP_RADIUS = 2.0                    // collision radius

// Asteroid properties
export const ASTEROID_LARGE_RADIUS = 8
export const ASTEROID_MEDIUM_RADIUS = 4
export const ASTEROID_SMALL_RADIUS = 2

// Scoring
export const SCORE_LARGE = 20
export const SCORE_MEDIUM = 50
export const SCORE_SMALL = 100
export const SCORE_BONUS_SHIP = 10000

// Wave difficulty
export const WAVES = [
  { count: 3, size: 'large' },
  { count: 4, size: 'large' },
  { count: 2, size: 'large' },
  { count: 3, size: 'medium' },
  { count: 4, size: 'medium' },
  { count: 5, size: 'medium' },
  { count: 2, size: 'large' },
  { count: 2, size: 'medium' },
  { count: 4, size: 'small' },
  { count: 3, size: 'large' },
  { count: 3, size: 'medium' },
  { count: 4, size: 'small' },
  { count: 2, size: 'large' },
  { count: 2, size: 'medium' },
  { count: 3, size: 'small' },
]
