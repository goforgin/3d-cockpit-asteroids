import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../../store/gameStore'
import * as THREE from 'three'

export const Ship = () => {
  const shipRef = useRef<THREE.Group>(null!)
  const { camera } = useThree()
  
  // Set camera FOV once on mount
  useEffect(() => {
    camera.position.set(0, 0, 0)
    if ('fov' in camera) {
      camera.fov = 75
      camera.updateProjectionMatrix()
    }
  }, [camera])
  
  // Read ship from store and apply to cockpit
  const ship = useGameStore((state) => state.state.ship)
  
  useFrame(() => {
    if (shipRef.current) {
      // Apply position and rotation from game state
      shipRef.current.position.set(ship.position.x, ship.position.y, ship.position.z)
      shipRef.current.rotation.set(ship.rotation.pitch, ship.rotation.yaw, 0, 'YXZ')
    }
  })
  
  return (
    <group ref={shipRef}>
      {/* Dashboard - dark metal below view */}
      <mesh position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[2.5, 0.1, 1.5]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.35} metalness={0.7} />
      </mesh>
      
      {/* Dashboard accents - emissive cyan/green */}
      <mesh position={[-0.5, -0.75, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.8, 0.05, 0.1]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.3} roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.5, -0.75, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.8, 0.05, 0.1]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.3} roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Left side frame strut */}
      <mesh position={[-1.2, 0, 0]}>
        <boxGeometry args={[0.2, 1.5, 1.5]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.35} metalness={0.7} />
      </mesh>
      
      {/* Right side frame strut */}
      <mesh position={[1.2, 0, 0]}>
        <boxGeometry args={[0.2, 1.5, 1.5]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.35} metalness={0.7} />
      </mesh>
      
      {/* Top canopy frame */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.5, 0.1, 1.5]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.35} metalness={0.7} />
      </mesh>
      
      {/* Top frame struts */}
      <mesh position={[-1.1, 0.7, 0]}>
        <boxGeometry args={[0.2, 0.6, 1.5]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.35} metalness={0.7} />
      </mesh>
      <mesh position={[1.1, 0.7, 0]}>
        <boxGeometry args={[0.2, 0.6, 1.5]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.35} metalness={0.7} />
      </mesh>
      
      {/* Rear wall */}
      <mesh position={[0, 0, -0.8]}>
        <boxGeometry args={[2.4, 1.6, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.35} metalness={0.7} />
      </mesh>
      
      {/* Rear frame */}
      <mesh position={[-1.1, 0.6, -0.75]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.35} metalness={0.7} />
      </mesh>
      <mesh position={[1.1, 0.6, -0.75]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.35} metalness={0.7} />
      </mesh>
      <mesh position={[-1.1, -0.6, -0.75]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.35} metalness={0.7} />
      </mesh>
      <mesh position={[1.1, -0.6, -0.75]}>
        <boxGeometry args={[0.2, 0.8, 0.2]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.35} metalness={0.7} />
      </mesh>
      
      {/* Subtle glass canopy - thin transparent plane */}
      <mesh position={[0, 0, 0.6]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.3, 1.4, 0.05]} />
        <meshPhysicalMaterial 
          transmission={0.95} 
          transparent={true} 
          opacity={0.98} 
          roughness={0.05} 
          metalness={0.05} 
          thickness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>
      
      {/* Dark frame at viewport edges for vignette effect */}
      <mesh position={[-1.3, 0, 0.55]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.2, 1.6, 0.2]} />
        <meshStandardMaterial color="#000000" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[1.3, 0, 0.55]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.2, 1.6, 0.2]} />
        <meshStandardMaterial color="#000000" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, 0.8, 0.55]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.6, 0.2, 0.2]} />
        <meshStandardMaterial color="#000000" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, -0.8, 0.55]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.6, 0.2, 0.2]} />
        <meshStandardMaterial color="#000000" roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}
