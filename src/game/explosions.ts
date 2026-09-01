import { Explosion } from '../game/types'

export const spawnExplosion = (position: { x: number; y: number; z: number }): Explosion => {
  const particles = []
  const particleCount = 30
  
  for (let i = 0; i < particleCount; i++) {
    // Random velocity outward from explosion center
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)
    const speed = Math.random() * 10 + 5
    
    const velocity = {
      x: speed * Math.sin(phi) * Math.cos(theta),
      y: speed * Math.sin(phi) * Math.sin(theta),
      z: speed * Math.cos(phi),
    }
    
    particles.push({
      position: { ...position },
      velocity,
      lifetime: 0,
      maxLifetime: 0.5 + Math.random() * 0.3,
    })
  }
  
  return {
    id: `explosion-${Date.now()}-${Math.random()}`,
    position,
    particles,
    createdAt: Date.now(),
  }
}
