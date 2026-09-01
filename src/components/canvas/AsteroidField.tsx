import { useMemo } from 'react'
import { useGameStore } from '../../store/gameStore'
import { Asteroid } from './Asteroid'

export const AsteroidField = () => {
  const asteroids = useGameStore((state) => state.state.asteroids)
  
  // Create memoized asteroid meshes
  const asteroidMeshes = useMemo(() => {
    return asteroids.map((asteroid) => (
      <Asteroid
        key={asteroid.id}
        position={asteroid.position}
        radius={asteroid.radius}
        type={asteroid.type}
        rotationSpeed={asteroid.rotationSpeed}
        id={asteroid.id}
      />
    ))
  }, [asteroids])
  
  return <>{asteroidMeshes}</>
}
