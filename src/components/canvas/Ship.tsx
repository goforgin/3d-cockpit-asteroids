import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../../store/gameStore'
import * as THREE from 'three'
import { CockpitConsole } from './CockpitConsole'

export const Ship = () => {
  const cockpitRef = useRef<THREE.Group>(null!)
  const { camera } = useThree()

  // Configure the camera once on mount.
  useEffect(() => {
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as THREE.PerspectiveCamera
      cam.fov = 75
      cam.near = 0.05
      cam.far = 5000 // keep distant background planets visible
      cam.updateProjectionMatrix()
    }
    // Match the Euler order used to derive the forward vector (see shipPhysics).
    camera.rotation.order = 'YXZ'
  }, [camera])

  // Drive the camera (and the cockpit that frames it) directly from ship state
  // every frame. The pilot sits at the ship's position and looks along the
  // ship's forward axis, so the crosshair (screen center) always points where
  // the ship is aimed.
  useFrame(() => {
    const ship = useGameStore.getState().state.ship
    camera.position.set(ship.position.x, ship.position.y, ship.position.z)
    camera.rotation.set(ship.rotation.pitch, ship.rotation.yaw, 0, 'YXZ')

    if (cockpitRef.current) {
      cockpitRef.current.position.copy(camera.position)
      cockpitRef.current.quaternion.copy(camera.quaternion)
    }
  })

  return (
    <group ref={cockpitRef}>
      {/* Inner group flips the cockpit so the canopy/window faces forward (-Z),
          which is the direction the camera looks. */}
      <group rotation={[0, Math.PI, 0]}>
      {/* Detailed control console (dashboard, MFDs, buttons, gauges, throttle) */}
      <CockpitConsole />

      {/* Dashboard base - dark metal below view */}
      <mesh position={[0, -0.9, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[2.6, 1.1, 0.1]} />
        <meshStandardMaterial color="#202226" roughness={0.5} metalness={0.7} />
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
      
      {/* Subtle glass canopy - kept very transparent so it never obscures aim */}
      <mesh position={[0, 0, 0.6]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.3, 1.4, 0.05]} />
        <meshPhysicalMaterial
          transparent={true}
          opacity={0.08}
          roughness={0.05}
          metalness={0.1}
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
    </group>
  )
}
