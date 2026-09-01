// Game constants - tunable numbers for gameplay balance

// Rotation (joystick-style: angular velocity ramps up while a key is held and
// coasts to a stop when released, instead of snapping instantly)
export const ROTATION_YAW_SPEED = 1.4              // rad/s max yaw rate (~80°/s)
export const ROTATION_PITCH_SPEED = 1.1            // rad/s max pitch rate (~63°/s)
export const ROTATION_ACCEL = 5.0                  // rad/s² ramp-up rate
export const ROTATION_DAMPING = 9.0                // per-second decay when no input

// Thrust and movement (space inertia — momentum carries, gentle drag)
export const THRUST_ACCEL = 45                     // units/s²
export const MAX_SPEED = 55                        // units/s
export const LINEAR_DRAG = 0.35                    // fraction of velocity lost per second

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
