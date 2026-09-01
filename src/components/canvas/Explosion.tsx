import { Explosion as ExplosionType } from '../../game/types'

export const updateExplosion = (explosion: ExplosionType, deltaTime: number): ExplosionType => {
  const updatedParticles = explosion.particles
    .map(p => ({
      ...p,
      lifetime: p.lifetime + deltaTime,
      position: {
        x: p.position.x + p.velocity.x * deltaTime,
        y: p.position.y + p.velocity.y * deltaTime,
        z: p.position.z + p.velocity.z * deltaTime,
      },
    }))
    .filter(p => p.lifetime < p.maxLifetime)
  
  return {
    ...explosion,
    particles: updatedParticles,
  }
}

export const isExplosionExpired = (explosion: ExplosionType, now: number): boolean => {
  return now > explosion.createdAt + 600 // 0.6 seconds
}
