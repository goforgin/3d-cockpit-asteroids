import { GameCanvas } from './components/canvas/GameCanvas'
import { HUD } from './components/hud/HUD'
import { useGameSimulation } from './hooks/useGameSimulation'
import { useGameLoop } from './hooks/useGameLoop'
import { useGameFlow } from './hooks/useGameFlow'

function App() {
  // Wire game simulation hook (includes ship physics)
  const { simulationTick } = useGameSimulation()
  
  // Wire game loop
  useGameLoop(simulationTick)
  
  // Wire game flow (input handling for menu/pause/gameover)
  useGameFlow()
  
  return (
    <div className="relative w-full h-screen bg-black">
      <GameCanvas />
      <HUD />
    </div>
  )
}

export { App }
