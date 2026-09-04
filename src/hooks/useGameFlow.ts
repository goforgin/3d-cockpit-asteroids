import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { audioManager } from '../audio/audioManager'

export const useGameFlow = () => {
  const gameState = useGameStore((state) => state.state.gameState)
  const { startGame, pauseGame, resumeGame, toggleMute } = useGameStore()
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return
      if (e.repeat) return

      const key = (e.key || '').toLowerCase()
      const code = e.code || ''
      const isEnter = key === 'enter' || code === 'Enter' || code === 'NumpadEnter'
      const isEscape = key === 'escape' || code === 'Escape'
      const isSpace = key === ' ' || key === 'spacebar' || code === 'Space'
      const isMute = key === 'm' || code === 'KeyM'

      audioManager.init()

      if (isEscape || isEnter || isSpace) {
        e.preventDefault()
      }

      if (isEscape) {
        if (gameState === 'playing') {
          pauseGame()
        } else if (gameState === 'paused') {
          resumeGame()
        }
      }

      if (isEnter) {
        if (gameState === 'menu' || gameState === 'gameover') {
          audioManager.init()
          startGame()
        }
      }

      if (isMute) {
        toggleMute()
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [gameState, pauseGame, resumeGame, startGame, toggleMute])
}
