import { useGameStore } from '../../store/gameStore'
import { Saucer } from './Saucer'

export const EnemyField = () => {
  const enemies = useGameStore((state) => state.state.enemies)

  return (
    <>
      {enemies.map((enemy) => (
        <Saucer
          key={enemy.id}
          id={enemy.id}
          type={enemy.type}
          position={enemy.position}
          radius={enemy.radius}
        />
      ))}
    </>
  )
}
