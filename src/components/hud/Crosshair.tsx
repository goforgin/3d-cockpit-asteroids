import { useGameStore } from '../../store/gameStore'

export const Crosshair = () => {
  const gameState = useGameStore((state) => state.state.gameState)
  
  // Only show crosshair during gameplay
  if (gameState !== 'playing') {
    return null
  }
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="relative w-10 h-10">
        {/* Outer circle */}
        <div 
          className="absolute inset-0 border border-white/60 rounded-full"
          style={{
            boxShadow: '0 0 8px rgba(0, 255, 255, 0.3)',
          }}
        />
        
        {/* Inner dot */}
        <div 
          className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            boxShadow: '0 0 4px rgba(0, 255, 255, 0.5)',
          }}
        />
        
        {/* Four gap lines (not full cross) */}
        <div 
          className="absolute top-1/2 left-0 w-[40%] h-px bg-white/60 -translate-y-1/2"
          style={{
            boxShadow: '0 0 4px rgba(0, 255, 255, 0.3)',
          }}
        />
        <div 
          className="absolute top-1/2 right-0 w-[40%] h-px bg-white/60 -translate-y-1/2"
          style={{
            boxShadow: '0 0 4px rgba(0, 255, 255, 0.3)',
          }}
        />
        <div 
          className="absolute top-0 left-1/2 h-[40%] w-px bg-white/60 -translate-x-1/2"
          style={{
            boxShadow: '0 0 4px rgba(0, 255, 255, 0.3)',
          }}
        />
        <div 
          className="absolute bottom-0 left-1/2 h-[40%] w-px bg-white/60 -translate-x-1/2"
          style={{
            boxShadow: '0 0 4px rgba(0, 255, 255, 0.3)',
          }}
        />
      </div>
    </div>
  )
}
