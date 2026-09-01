import { ScoreBoard } from './ScoreBoard'
import { Crosshair } from './Crosshair'
import { GameOverlay } from './GameOverlay'
import { Radar } from './Radar'
import { ShieldPips } from './ShieldPips'
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
      <GameOverlay gameState={gameState} />
    </>
  )
}
