import { useGameStore } from '../../store/gameStore'
import { getRadarBlips } from '../../game/radar'
import { PLAY_SPACE_SIZE } from '../../game/constants'

const WORLD_HALF_SIZE = PLAY_SPACE_SIZE / 2
const RADAR_SIZE = 120
const CENTER = RADAR_SIZE / 2

// Blip sizes
const BLIP_SIZES = {
  large: 6,
  medium: 4,
  small: 2,
}

export const Radar = () => {
  const { ship, asteroids, enemies } = useGameStore((state) => ({
    ship: state.state.ship,
    asteroids: state.state.asteroids,
    enemies: state.state.enemies,
  }))
  
  // Get radar blips
  const blips = getRadarBlips(
    ship.position,
    ship.rotation.yaw,
    ship.rotation.pitch,
    asteroids,
    WORLD_HALF_SIZE
  )

  // Enemy saucers get their own (red) blips. getRadarBlips only reads
  // position/type/id, which EnemySaucer provides.
  const enemyBlips = getRadarBlips(
    ship.position,
    ship.rotation.yaw,
    ship.rotation.pitch,
    enemies as unknown as Parameters<typeof getRadarBlips>[3],
    WORLD_HALF_SIZE
  )
  
  return (
    <div className="absolute bottom-8 left-8 pointer-events-none">
      {/* Radar container */}
      <div
        className="relative rounded-full border-2 border-green-500/50 shadow-[inset_0_0_20px_rgba(0,255,0,0.1)]"
        style={{
          width: RADAR_SIZE,
          height: RADAR_SIZE,
          backgroundColor: '#001a00',
          overflow: 'hidden',
        }}
      >
        {/* CRT Scanline overlay */}
        <div className="absolute inset-0 crt-scanline pointer-events-none z-10" />
        
        {/* Radar grid circles */}
        <div
          className="absolute border border-green-500/20 rounded-full pointer-events-none z-10"
          style={{
            left: CENTER - 30,
            top: CENTER - 30,
            width: 60,
            height: 60,
          }}
        />
        <div
          className="absolute border border-green-500/20 rounded-full pointer-events-none z-10"
          style={{
            left: CENTER - 60,
            top: CENTER - 60,
            width: 120,
            height: 120,
          }}
        />
        
        {/* Radar crosshair */}
        <div
          className="absolute border border-green-500/20 pointer-events-none z-10"
          style={{
            left: CENTER - 60,
            top: CENTER - 1,
            width: 120,
            height: 2,
          }}
        />
        <div
          className="absolute border border-green-500/20 pointer-events-none z-10"
          style={{
            left: CENTER - 1,
            top: CENTER - 60,
            width: 2,
            height: 120,
          }}
        />
        
        {/* Center dot (player position) */}
        <div
          className="absolute bg-green-400 rounded-full shadow-[0_0_5px_#00ff88] z-20"
          style={{
            left: CENTER - 2,
            top: CENTER - 2,
            width: 4,
            height: 4,
          }}
        />
        
        {/* Blips */}
        {blips.map((blip) => {
          const size = BLIP_SIZES[blip.size]
          const blipX = blip.x * RADAR_SIZE
          const blipY = blip.y * RADAR_SIZE
          
          return (
            <div
              key={blip.id}
              className="absolute z-15"
              style={{
                left: blipX,
                top: blipY,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Elevation indicator */}
              {blip.elevation === 'high' && (
                <div
                  className="absolute bg-green-500"
                  style={{
                    left: '50%',
                    top: -4,
                    width: 2,
                    height: 3,
                    transform: 'translateX(-50%)',
                  }}
                />
              )}
              {blip.elevation === 'low' && (
                <div
                  className="absolute bg-green-500"
                  style={{
                    left: '50%',
                    top: size + 2,
                    width: 2,
                    height: 3,
                    transform: 'translateX(-50%)',
                  }}
                />
              )}
              
              {/* Main blip */}
              <div
                className="bg-green-400 rounded-full shadow-[0_0_5px_#00ff88]"
                style={{
                  width: size,
                  height: size,
                }}
              />
            </div>
          )
        })}

        {/* Enemy saucer blips — red diamonds (distinct from round rock blips) */}
        {enemyBlips.map((blip) => {
          const size = (BLIP_SIZES[blip.size] ?? 4) + 3
          return (
            <div
              key={`enemy-${blip.id}`}
              className="absolute z-20 bg-red-500 animate-pulse shadow-[0_0_7px_#ff2222]"
              style={{
                left: blip.x * RADAR_SIZE,
                top: blip.y * RADAR_SIZE,
                width: size,
                height: size,
                // Rotate a square into a diamond to differentiate from rocks.
                transform: 'translate(-50%, -50%) rotate(45deg)',
              }}
            />
          )
        })}
        
        {/* Radar label */}
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-green-400/70 font-mono pointer-events-none z-20"
          style={{ fontFamily: 'monospace' }}
        >
          RADAR
        </div>
      </div>
    </div>
  )
}
