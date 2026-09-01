import { useMemo } from 'react'
import { useGameStore } from '../../store/gameStore'
import { LaserBolt } from './LaserBolt'

export const LaserField = () => {
  const lasers = useGameStore((state) => state.state.lasers)
  
  // Create memoized laser bolts
  const laserBolts = useMemo(() => {
    return lasers.map((laser) => (
      <LaserBolt
        key={laser.id}
        position={laser.position}
        velocity={laser.velocity}
      />
    ))
  }, [lasers])
  
  return <>{laserBolts}</>
}
