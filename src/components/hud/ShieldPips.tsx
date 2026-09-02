import { useGameStore } from '../../store/gameStore'
import { SHIELD_HITS_PER_SHIP } from '../../game/constants'
import { useEffect, useState } from 'react'

export const ShieldPips = () => {
  const shieldHitsLeft = useGameStore((state) => state.state.ship.shieldHitsLeft)
  const shieldActiveUntil = useGameStore((state) => state.state.ship.shieldActiveUntil)
  const now = Date.now()
  const isShieldActive = now < shieldActiveUntil
  
  // Track previous shield hits for flash effect
  const [previousHits, setPreviousHits] = useState(shieldHitsLeft)
  const [flashPip, setFlashPip] = useState<number | null>(null)
  
  // Detect when shield hits decrease and trigger flash
  useEffect(() => {
    if (shieldHitsLeft < previousHits) {
      setFlashPip(shieldHitsLeft)
      setTimeout(() => setFlashPip(null), 200)
    }
    setPreviousHits(shieldHitsLeft)
  }, [shieldHitsLeft, previousHits])
  
  return (
    <div className="pointer-events-none flex flex-col items-center space-y-1.5">
      <div
        className={`text-[10px] font-mono ${isShieldActive ? 'text-cyan-300' : 'text-cyan-500/70'}`}
        style={{ fontFamily: "'Orbitron', monospace" }}
      >
        SHIELDS
      </div>
      <div className="flex space-x-1">
        {[...Array(SHIELD_HITS_PER_SHIP)].map((_, i) => {
          const isChargeAvailable = i < shieldHitsLeft
          const isFlashing = flashPip === i
          
          return (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                isChargeAvailable
                  ? isFlashing
                    ? 'bg-red-500 border-red-500 shadow-[0_0_8px_#ff0000]'
                    : isShieldActive
                    ? 'bg-cyan-400 shadow-[0_0_6px_#00ffff]'
                    : 'bg-cyan-500 shadow-[0_0_5px_#00aaff]'
                  : 'bg-transparent border-cyan-500/30'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
