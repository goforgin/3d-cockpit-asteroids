import { useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import { audioManager } from '../../audio/audioManager'

interface GameOverlayProps {
  gameState: 'menu' | 'playing' | 'paused' | 'gameover'
}

export const GameOverlay = ({ gameState }: GameOverlayProps) => {
  const { startGame, resumeGame } = useGameStore()
  const score = useGameStore((state) => state.state.score)

  const formattedScore = score.toString().padStart(6, '0')

  const begin = () => {
    audioManager.init()
    startGame()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return
      const isEnter = e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter'
      if (gameState === 'menu' && isEnter) {
        e.preventDefault()
        begin()
      }
      if (gameState === 'gameover' && isEnter) {
        e.preventDefault()
        begin()
      }
      if (gameState === 'paused' && (e.key === 'Escape' || e.code === 'Escape')) {
        e.preventDefault()
        resumeGame()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [gameState, startGame, resumeGame])

  if (gameState === 'playing') return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
      <div className="text-center text-white space-y-6 px-4">
        {gameState === 'menu' && (
          <>
            <h1 className="text-6xl font-bold tracking-wider hud-text-glow" style={{ fontFamily: "'Orbitron', monospace" }}>
              ASTEROIDS
            </h1>
            <h2 className="text-2xl font-bold tracking-widest hud-text-glow" style={{ fontFamily: "'Orbitron', monospace" }}>
              COCKPIT EDITION
            </h2>
            <button
              type="button"
              onClick={begin}
              className="text-xl hud-text-glow px-6 py-3 border border-cyan-400/60 rounded-sm hover:bg-cyan-400/10 cursor-pointer"
              style={{ fontFamily: "'Orbitron', monospace" }}
            >
              CLICK OR PRESS ENTER TO START
            </button>
            <div className="text-sm text-gray-400 mt-8 space-y-1 font-mono">
              <p>ARROWS or WASD: Steer</p>
              <p>X: Thrust</p>
              <p>SPACE: Fire</p>
              <p>Z: Shield (3 bursts per life)</p>
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
            <button
              type="button"
              onClick={() => resumeGame()}
              className="text-lg hud-text-glow px-6 py-3 border border-cyan-400/60 rounded-sm hover:bg-cyan-400/10 cursor-pointer"
              style={{ fontFamily: "'Orbitron', monospace" }}
            >
              CLICK OR PRESS ESC TO RESUME
            </button>
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
            <button
              type="button"
              onClick={begin}
              className="text-xl hud-text-glow mt-4 px-6 py-3 border border-cyan-400/60 rounded-sm hover:bg-cyan-400/10 cursor-pointer"
              style={{ fontFamily: "'Orbitron', monospace" }}
            >
              CLICK OR PRESS ENTER TO RESTART
            </button>
          </>
        )}
      </div>
    </div>
  )
}
