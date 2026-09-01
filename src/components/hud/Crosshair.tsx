import { useGameStore } from '../../store/gameStore'

export const Crosshair = () => {
  const gameState = useGameStore((state) => state.state.gameState)
  const locked = useGameStore((state) => state.state.lockedAsteroidId !== null)

  // Only show crosshair during gameplay
  if (gameState !== 'playing') {
    return null
  }

  // Red when locked onto a rock, cyan/white otherwise.
  const lineColor = locked ? 'rgba(255, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.6)'
  const glow = locked ? '0 0 8px rgba(255, 0, 0, 0.9)' : '0 0 6px rgba(0, 255, 255, 0.3)'

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <div
        className="relative w-10 h-10"
        style={{ transition: 'transform 0.08s ease-out', transform: locked ? 'scale(1.15)' : 'scale(1)' }}
      >
        {/* Outer circle */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `${locked ? 2 : 1}px solid ${lineColor}`,
            boxShadow: glow,
          }}
        />

        {/* Inner dot */}
        <div
          className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{ backgroundColor: lineColor, boxShadow: glow }}
        />

        {/* Four gap lines (not full cross) */}
        <div
          className="absolute top-1/2 left-0 w-[40%] h-px -translate-y-1/2"
          style={{ backgroundColor: lineColor, boxShadow: glow }}
        />
        <div
          className="absolute top-1/2 right-0 w-[40%] h-px -translate-y-1/2"
          style={{ backgroundColor: lineColor, boxShadow: glow }}
        />
        <div
          className="absolute top-0 left-1/2 h-[40%] w-px -translate-x-1/2"
          style={{ backgroundColor: lineColor, boxShadow: glow }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-[40%] w-px -translate-x-1/2"
          style={{ backgroundColor: lineColor, boxShadow: glow }}
        />

        {/* LOCK label when a target is acquired */}
        {locked && (
          <div
            className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-widest"
            style={{
              top: '-18px',
              color: 'rgba(255, 40, 40, 0.95)',
              textShadow: '0 0 6px rgba(255,0,0,0.9)',
              fontFamily: "'Orbitron', monospace",
            }}
          >
            LOCK
          </div>
        )}
      </div>
    </div>
  )
}
