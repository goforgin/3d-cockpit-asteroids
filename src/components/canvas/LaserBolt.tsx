import { useRef } from 'react'
import * as THREE from 'three'

interface LaserProps {
  position: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
}

export const LaserBolt = ({ position, velocity }: LaserProps) => {
  const laserRef = useRef<THREE.Mesh>(null!)
  const lightRef = useRef<THREE.PointLight>(null!)

  // Unit travel direction
  const mag = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2) || 1
  const dir = { x: velocity.x / mag, y: velocity.y / mag, z: velocity.z / mag }

  // A long streak that trails behind the leading tip.
  const length = 28
  const glowLength = 44

  // The cylinder is centered on its origin, so shift the center back along the
  // travel direction by half its length. That places the leading tip at the
  // laser's actual position and lets the body trail out behind it.
  const center = {
    x: position.x - dir.x * (length / 2),
    y: position.y - dir.y * (length / 2),
    z: position.z - dir.z * (length / 2),
  }
  const glowCenter = {
    x: position.x - dir.x * (glowLength / 2),
    y: position.y - dir.y * (glowLength / 2),
    z: position.z - dir.z * (glowLength / 2),
  }

  // Align cylinder with velocity direction.
  // cylinderGeometry's long axis is Y, so map +Y onto the travel direction.
  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dir.x, dir.y, dir.z))

  return (
    <>
      {/* Bright core bolt */}
      <mesh ref={laserRef} position={[center.x, center.y, center.z]} quaternion={quaternion}>
        <cylinderGeometry args={[0.09, 0.02, length, 8]} />
        <meshStandardMaterial
          color="#aaffff"
          emissive="#00ffff"
          emissiveIntensity={4}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {/* Wider, faded trailing glow */}
      <mesh position={[glowCenter.x, glowCenter.y, glowCenter.z]} quaternion={quaternion}>
        <cylinderGeometry args={[0.28, 0.0, glowLength, 8]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Point light at the tip for bloom */}
      <pointLight
        ref={lightRef}
        position={[position.x, position.y, position.z]}
        color="#00ffff"
        intensity={0.8}
        distance={14}
      />
    </>
  )
}
