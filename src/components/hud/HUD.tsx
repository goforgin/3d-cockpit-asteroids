import { ScoreBoard } from './ScoreBoard'
import { Crosshair } from './Crosshair'
import { GameOverlay } from './GameOverlay'
import { Radar } from './Radar'
import { ShieldPips } from './ShieldPips'
import { AudioIndicator } from './AudioIndicator'
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
          <Radar />
          <ShieldPips />
        </>
      )}
      {/* Ship destruction flash/flames — shows over gameplay and game-over */}
      <ShipHitOverlay />
      {/* Audio state is always visible so the mute toggle is discoverable */}
      <AudioIndicator />
      <GameOverlay gameState={gameState} />
    </>
  )
}
