import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { audioManager } from '../audio/audioManager'

export const useGameFlow = () => {
  const gameState = useGameStore((state) => state.state.gameState)
  const { startGame, pauseGame, resumeGame, toggleMute } = useGameStore()
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      // Unlock audio on the first user interaction (required by browsers).
      audioManager.init()

      // Prevent default for game keys
      if (['escape', 'enter', ' '].includes(key)) {
        e.preventDefault()
      }
      
      // Escape key: Pause/Resume
      if (key === 'escape') {
        if (gameState === 'playing') {
          pauseGame()
        } else if (gameState === 'paused') {
          resumeGame()
        }
      }
      
      // Enter key: Start/Restart
      if (key === 'enter') {
        if (gameState === 'menu') {
          // Initialize audio on first interaction
          audioManager.init()
          startGame()
        } else if (gameState === 'gameover') {
          // Restart game
          startGame()
        }
      }
      
      // M key: Toggle mute (updates store so the HUD indicator reflects it)
      if (key === 'm') {
        toggleMute()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [gameState, pauseGame, resumeGame, startGame, toggleMute])
}
