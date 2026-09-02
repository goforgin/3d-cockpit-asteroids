import { useEffect, useRef } from 'react'

export const useGameLoop = (callback: (deltaTime: number) => void, enabled: boolean = true) => {
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()
  
  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      // Clamp so a tab-switch / first frame after start can't teleport rocks
      // through the ship in a single tick.
      const deltaTime = Math.min((time - previousTimeRef.current) / 1000, 0.05)
      callback(deltaTime)
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }
  
  useEffect(() => {
    if (enabled) {
      requestRef.current = requestAnimationFrame(animate)
    } else {
      previousTimeRef.current = undefined
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [enabled, callback])
}
