import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { displaceGeometry, getAsteroidColor } from '../../game/procedural'

interface AsteroidProps {
  position: { x: number; y: number; z: number }
  radius: number
  type?: 'large' | 'medium' | 'small'
  rotationSpeed?: { x: number; y: number; z: number }
  id: string
}

export const Asteroid = ({ 
  position, 
  radius, 
  type = 'large',
  rotationSpeed = { x: 0.2, y: 0.3, z: 0.1 },
  id
}: AsteroidProps) => {
  const asteroidRef = useRef<THREE.Group>(null!)
  
  useFrame((state) => {
    if (asteroidRef.current) {
      const delta = state.clock.getDelta()
      asteroidRef.current.rotation.x += rotationSpeed.x * delta
      asteroidRef.current.rotation.y += rotationSpeed.y * delta
      asteroidRef.current.rotation.z += rotationSpeed.z * delta
    }
  })
  
  // Generate geometry with vertex displacement based on asteroid ID
  const geometry = useMemo(() => {
    // Detail level based on type (higher for larger asteroids)
    const detail = type === 'large' ? 2 : type === 'medium' ? 1 : 0
    
    const geo = new THREE.IcosahedronGeometry(radius, detail)
    
    // Displace vertices for irregular shape
    // Amount based on radius - larger asteroids have more pronounced features
    const displacementAmount = radius * 0.15
    displaceGeometry(geo, id, displacementAmount)
    
    return geo
  }, [radius, type, id])
  
  // Color based on type
  const color = getAsteroidColor(type)
  
  return (
    <group ref={asteroidRef} position={[position.x, position.y, position.z]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial 
          color={color} 
          roughness={0.9} 
          metalness={0.05}
          flatShading={true}
        />
      </mesh>
    </group>
  )
}
