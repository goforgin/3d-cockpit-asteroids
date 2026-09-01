import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { audioManager } from '../audio/audioManager'

export const useGameFlow = () => {
  const gameState = useGameStore((state) => state.state.gameState)
  const { startGame, pauseGame, resumeGame } = useGameStore()
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      
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
      
      // M key: Toggle mute
      if (key === 'm') {
        const isMuted = audioManager.toggleMute()
        // Show mute indicator (could be added to HUD later)
        console.log(isMuted ? 'Muted' : 'Unmuted')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [gameState, pauseGame, resumeGame, startGame])
}
