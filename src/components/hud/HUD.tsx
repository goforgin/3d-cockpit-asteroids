import { ScoreBoard } from './ScoreBoard'
import { Crosshair } from './Crosshair'
import { GameOverlay } from './GameOverlay'
import { CockpitDash } from './CockpitDash'
import { ShipHitOverlay } from './ShipHitOverlay'
import { useGameStore } from '../../store/gameStore'

export const HUD = () => {
  const gameState = useGameStore((state) => state.state.gameState)
  
  return (
    <>
      {/* Only show HUD elements when playing */}
      {gameState === 'playing' && (
        <>
          <ScoreBoard />
          <Crosshair />
          <CockpitDash />
        </>
      )}
      {/* Ship destruction flash/flames — shows over gameplay and game-over */}
      <ShipHitOverlay />
      <GameOverlay gameState={gameState} />
    </>
  )
}
