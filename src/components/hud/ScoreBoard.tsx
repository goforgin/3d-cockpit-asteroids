import { useGameStore } from '../../store/gameStore'

// Set to true for debug info, false for production
const DEBUG = false

export const ScoreBoard = () => {
  const { score, lives, wave, ship } = useGameStore((state) => ({
    score: state.state.score,
    lives: state.state.lives,
    wave: state.state.wave,
    ship: state.state.ship,
  }))
  
  // Calculate speed from velocity
  const speed = Math.sqrt(
    ship.velocity.x * ship.velocity.x +
    ship.velocity.y * ship.velocity.y +
    ship.velocity.z * ship.velocity.z
  )
  
  // Check if invulnerable
  const isInvulnerable = Date.now() < ship.invulnerableUntil
  const invulnerableTime = Math.max(0, (ship.invulnerableUntil - Date.now()) / 1000)
  
  // Format score as 6-digit zero-padded
  const formattedScore = score.toString().padStart(6, '0')
  
  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
      {/* Left side: Score and Wave */}
      <div className="text-white space-y-2">
        <div className="text-4xl font-bold tracking-widest hud-text-glow" style={{ fontFamily: "'Orbitron', monospace" }}>
          SCORE: {formattedScore}
        </div>
        <div className="text-xl font-mono hud-text-glow" style={{ fontFamily: "'Orbitron', monospace" }}>
          WAVE: {wave}
        </div>
      </div>
      
      {/* Right side: Lives and debug info */}
      <div className="text-white space-y-2">
        {/* Lives as ship triangle icons */}
        <div className="flex items-center space-x-1">
          <span className="text-sm font-mono hud-text-glow mr-2" style={{ fontFamily: "'Orbitron', monospace" }}>
            LIVES:
          </span>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 border-2 ${i <= lives ? 'bg-white' : 'bg-transparent'} border-white/50 rounded-sm`}
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              }}
            />
          ))}
        </div>
        
        {/* Debug info (hidden in production) */}
        {DEBUG && (
          <div className="text-xs font-mono opacity-70 space-y-1">
            <div>SPEED: {speed.toFixed(1)}</div>
            <div>
              POS: ({ship.position.x.toFixed(0)}, {ship.position.y.toFixed(0)}, {ship.position.z.toFixed(0)})
            </div>
            {isInvulnerable && (
              <div className="text-yellow-400">
                INVULN: {invulnerableTime.toFixed(1)}s
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
