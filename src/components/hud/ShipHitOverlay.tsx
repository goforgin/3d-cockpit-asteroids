import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'

const DURATION_MS = 1800

// Full-screen "your cockpit just blew up" effect: a red/orange flash, rising
// flames, and a shaking SHIP DESTROYED banner. Triggered whenever the ship is
// destroyed (loseLife sets state.shipHitAt).
export const ShipHitOverlay = () => {
  const shipHitAt = useGameStore((s) => s.state.shipHitAt)
  const [activeAt, setActiveAt] = useState(0)

  useEffect(() => {
    if (!shipHitAt) return
    setActiveAt(shipHitAt)
    const timer = setTimeout(() => setActiveAt(0), DURATION_MS)
    return () => clearTimeout(timer)
  }, [shipHitAt])

  if (!activeAt) return null

  return (
    <div
      key={activeAt}
      className="absolute inset-0 z-40 pointer-events-none overflow-hidden"
    >
      <div className="ship-hit-flash absolute inset-0" />
      <div className="flame-layer absolute inset-x-0 bottom-0 h-2/3" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="ship-hit-text text-5xl md:text-6xl font-bold tracking-widest text-center">
          SHIP DESTROYED
        </div>
      </div>
    </div>
  )
}
