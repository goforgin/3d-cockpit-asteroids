import { useEffect } from 'react'
import { inputManager } from '../game/input'

export const useKeyboard = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      // This will be updated by the game loop
    }, 16)
    
    return () => clearInterval(interval)
  }, [])
  
  return {
    up: inputManager.isKeyHeld('arrowup') || inputManager.isKeyHeld('w'),
    down: inputManager.isKeyHeld('arrowdown') || inputManager.isKeyHeld('s'),
    left: inputManager.isKeyHeld('arrowleft') || inputManager.isKeyHeld('a'),
    right: inputManager.isKeyHeld('arrowright') || inputManager.isKeyHeld('d'),
    thrust: inputManager.isKeyHeld('alt'),
    fire: inputManager.isKeyHeld(' '),
    shield: inputManager.isKeyHeld('z'),
    hyperspace: inputManager.isKeyHeld('shift'),
  }
}
