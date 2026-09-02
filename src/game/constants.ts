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
// Compact toroidal cube: rocks are always close and constantly wrap through the
// zone, so you must keep dodging. Fly off one edge and you reappear on the
// opposite side (radar included).
export const PLAY_SPACE_SIZE = 110                // 110x110x110 units
export const SHIP_RADIUS = 3.0                    // collision radius

// Asteroid drift speed (units/s). Spawned rocks head roughly toward the ship.
export const ASTEROID_MIN_SPEED = 11
export const ASTEROID_MAX_SPEED = 20

// --- Enemy saucers (classic Asteroids UFOs) ---
export const SCORE_SAUCER_LARGE = 200
export const SCORE_SAUCER_SMALL = 1000

export const SAUCER_LARGE_RADIUS = 5.5
export const SAUCER_SMALL_RADIUS = 3.0

// The big, easy saucer appears first; if you dawdle the small, aggressive one
// shows up and everything escalates.
export const SAUCER_LARGE_DELAY = 10              // seconds into a wave
export const SAUCER_SMALL_DELAY = 26              // seconds into a wave
export const MAX_SAUCERS = 1

// Movement speeds (units/s). Large is a slow, easy target; small is nimbler.
export const SAUCER_LARGE_SPEED = 12
export const SAUCER_SMALL_SPEED_MIN = 20
export const SAUCER_SMALL_SPEED_MAX = 30

// Enemy bullets
export const ENEMY_BULLET_SPEED_LARGE = 34
export const ENEMY_BULLET_SPEED_SMALL_MIN = 38
export const ENEMY_BULLET_SPEED_SMALL_MAX = 52
export const ENEMY_BULLET_LIFETIME = 3.0          // seconds
export const ENEMY_BULLET_RADIUS = 0.8

// How long (seconds) it takes the small saucer to ramp to full nastiness.
export const SAUCER_ESCALATION_TIME = 60

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
