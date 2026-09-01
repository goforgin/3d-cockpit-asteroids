import { useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'

interface GameOverlayProps {
  gameState: 'menu' | 'playing' | 'paused' | 'gameover'
}

export const GameOverlay = ({ gameState }: GameOverlayProps) => {
  const { startGame } = useGameStore()
  const score = useGameStore((state) => state.state.score)
  
  // Format score as 6-digit zero-padded
  const formattedScore = score.toString().padStart(6, '0')
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'menu' && e.key === 'Enter') {
        startGame()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, startGame])
  
  if (gameState === 'playing') return null
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none">
      <div className="text-center text-white space-y-6">
        {gameState === 'menu' && (
          <>
            <h1 className="text-6xl font-bold tracking-wider hud-text-glow" style={{ fontFamily: "'Orbitron', monospace" }}>
              ASTEROIDS
            </h1>
            <h2 className="text-2xl font-bold tracking-widest hud-text-glow" style={{ fontFamily: "'Orbitron', monospace" }}>
              COCKPIT EDITION
            </h2>
            <p className="text-xl hud-text-glow" style={{ fontFamily: "'Orbitron', monospace" }}>
              PRESS ENTER TO START
            </p>
            <div className="text-sm text-gray-400 mt-8 space-y-1 font-mono">
              <p>ARROWS: Steer</p>
              <p>X: Thrust</p>
              <p>SPACE: Fire</p>
              <p>Z: Shield</p>
              <p>SHIFT: Hyperspace</p>
              <p>ESC: Pause</p>
            </div>
          </>
        )}
        {gameState === 'paused' && (
          <>
            <h2 className="text-4xl font-bold hud-text-glow" style={{ fontFamily: "'Orbitron', monospace" }}>
              PAUSED
            </h2>
            <p className="text-lg hud-text-glow" style={{ fontFamily: "'Orbitron', monospace" }}>
              PRESS ESC TO RESUME
            </p>
          </>
        )}
        {gameState === 'gameover' && (
          <>
            <h2 className="text-4xl font-bold hud-text-glow" style={{ fontFamily: "'Orbitron', monospace" }}>
              GAME OVER
            </h2>
            <p className="text-2xl hud-text-glow" style={{ fontFamily: "'Orbitron', monospace" }}>
              SCORE: {formattedScore}
            </p>
            <p className="text-xl hud-text-glow mt-4" style={{ fontFamily: "'Orbitron', monospace" }}>
              PRESS ENTER TO RESTART
            </p>
          </>
        )}
      </div>
    </div>
  )
}
