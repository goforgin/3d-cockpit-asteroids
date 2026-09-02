import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../../store/gameStore'
import * as THREE from 'three'
import { CockpitConsole } from './CockpitConsole'

// First-person cockpit. The camera sits at the ship origin and looks along
// the ship's forward axis. All cockpit meshes live in an inner group that is
// yawed 180° so +Z is in FRONT of the camera. Geometry must stay at z > ~0.2
// so nothing intersects the near clip plane (that is what produced the giant
// black slab covering the lower half of the screen).
export const Ship = () => {
  const cockpitRef = useRef<THREE.Group>(null!)
  const { camera } = useThree()

  useEffect(() => {
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as THREE.PerspectiveCamera
      cam.fov = 75
      cam.near = 0.12
      cam.far = 5000
      cam.updateProjectionMatrix()
    }
    camera.rotation.order = 'YXZ'
  }, [camera])

  useFrame(() => {
    const ship = useGameStore.getState().state.ship
    camera.position.set(ship.position.x, ship.position.y, ship.position.z)
    camera.rotation.set(ship.rotation.pitch, ship.rotation.yaw, 0, 'YXZ')

    if (cockpitRef.current) {
      cockpitRef.current.position.copy(camera.position)
      cockpitRef.current.quaternion.copy(camera.quaternion)
    }
  })

  const frameMat = (
    <meshStandardMaterial
      color="#4a4e55"
      roughness={0.45}
      metalness={0.65}
      emissive="#1a1c20"
      emissiveIntensity={0.25}
    />
  )

  return (
    <group ref={cockpitRef}>
      <group rotation={[0, Math.PI, 0]}>
        {/* Local fill light so the frame/console read as metal, not silhouette */}
        <pointLight position={[0, 0.05, 0.2]} intensity={2.2} distance={4} color="#c8d6ff" />
        <pointLight position={[0, -0.2, 0.35]} intensity={1.4} distance={3} color="#ffc27a" />

        {/* Left window pillar */}
        <mesh position={[-0.72, 0.02, 0.4]}>
          <boxGeometry args={[0.12, 0.72, 0.1]} />
          {frameMat}
        </mesh>
        {/* Right window pillar */}
        <mesh position={[0.72, 0.02, 0.4]}>
          <boxGeometry args={[0.12, 0.72, 0.1]} />
          {frameMat}
        </mesh>
        {/* Top canopy bar */}
        <mesh position={[0, 0.36, 0.4]}>
          <boxGeometry args={[1.56, 0.08, 0.1]} />
          {frameMat}
        </mesh>
        {/* Tiny corner gussets */}
        <mesh position={[-0.68, 0.32, 0.4]} rotation={[0, 0, 0.6]}>
          <boxGeometry args={[0.16, 0.05, 0.09]} />
          {frameMat}
        </mesh>
        <mesh position={[0.68, 0.32, 0.4]} rotation={[0, 0, -0.6]}>
          <boxGeometry args={[0.16, 0.05, 0.09]} />
          {frameMat}
        </mesh>

        <CockpitConsole />
      </group>
    </group>
  )
}
