import { useRef } from 'react'
import * as THREE from 'three'

interface LaserProps {
  position: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
}

export const LaserBolt = ({ position, velocity }: LaserProps) => {
  const laserRef = useRef<THREE.Mesh>(null!)
  const lightRef = useRef<THREE.PointLight>(null!)
  
  // Calculate length based on velocity (for visual length)
  const speed = Math.sqrt(
    velocity.x * velocity.x +
    velocity.y * velocity.y +
    velocity.z * velocity.z
  )
  const length = Math.max(1, speed * 0.05) // Visual length based on speed
  
  // Calculate rotation to align with velocity
  const target = { ...velocity }
  const mag = Math.sqrt(target.x**2 + target.y**2 + target.z**2)
  target.x /= mag
  target.y /= mag
  target.z /= mag
  
  // Align cylinder with velocity direction.
  // cylinderGeometry's long axis is Y, so map +Y onto the travel direction.
  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(target.x, target.y, target.z))
  
  return (
    <>
      <mesh ref={laserRef} position={[position.x, position.y, position.z]} quaternion={quaternion}>
        <cylinderGeometry args={[0.05, 0.05, length, 8]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={3}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {/* Point light at laser position for bloom effect */}
      <pointLight
        ref={lightRef}
        position={[position.x, position.y, position.z]}
        color="#00ffff"
        intensity={0.5}
        distance={10}
      />
    </>
  )
}
