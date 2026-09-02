import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Compact instrument panel along the BOTTOM of the forward window.
// All meshes sit at z ≈ 0.38–0.46 (in front of the camera, past the near clip)
// and y ≈ -0.18 to -0.36 so they occupy the lower ~25% of the view and leave
// the crosshair / sky clear.
export const CockpitConsole = () => {
  const screenMat = useRef<THREE.MeshStandardMaterial>(null!)

  useFrame((state) => {
    if (screenMat.current) {
      screenMat.current.emissiveIntensity =
        1.4 + 0.35 * Math.sin(state.clock.elapsedTime * 2.2)
    }
  })

  const metal = (color: string, rough = 0.4, metalness = 0.7) => (
    <meshStandardMaterial
      color={color}
      roughness={rough}
      metalness={metalness}
      emissive={new THREE.Color('#22252a')}
      emissiveIntensity={0.2}
    />
  )

  const TILT = -0.28
  const Z = 0.42

  const buttons: { x: number; y: number; color: string }[] = []
  const palette = ['#00e5ff', '#00ff88', '#ffcc33', '#ff5566']
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 5; c++) {
      buttons.push({
        x: -0.28 + c * 0.14,
        y: -0.33 - r * 0.045,
        color: palette[(r * 5 + c) % palette.length],
      })
    }
  }

  return (
    <group>
      {/* Dash shelf — full width of the window, bottom of the view */}
      <mesh position={[0, -0.26, Z]} rotation={[TILT, 0, 0]}>
        <boxGeometry args={[1.55, 0.22, 0.08]} />
        {metal('#3d424a', 0.4, 0.72)}
      </mesh>
      {/* Lip / hood so the panel has thickness */}
      <mesh position={[0, -0.155, Z + 0.01]} rotation={[TILT, 0, 0]}>
        <boxGeometry args={[1.55, 0.03, 0.1]} />
        {metal('#5a6068', 0.35, 0.8)}
      </mesh>

      {/* Three MFD screens */}
      {[
        { x: -0.46, w: 0.36, em: '#00e5ff', bg: '#042028' },
        { x: 0.0, w: 0.44, em: '#00ff88', bg: '#042014' },
        { x: 0.46, w: 0.36, em: '#4aa3ff', bg: '#041428' },
      ].map((mfd, i) => (
        <group key={mfd.em} position={[mfd.x, -0.22, Z + 0.05]} rotation={[TILT, 0, 0]}>
          <mesh>
            <boxGeometry args={[mfd.w + 0.03, 0.14, 0.012]} />
            {metal('#111318', 0.6, 0.4)}
          </mesh>
          <mesh position={[0, 0, 0.008]}>
            <planeGeometry args={[mfd.w, 0.11]} />
            <meshStandardMaterial
              ref={i === 1 ? screenMat : undefined}
              color={mfd.bg}
              emissive={new THREE.Color(mfd.em)}
              emissiveIntensity={1.5}
              roughness={0.2}
              metalness={0.05}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Backlit buttons under the center screen */}
      {buttons.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, Z + 0.055]} rotation={[TILT, 0, 0]}>
          <boxGeometry args={[0.1, 0.032, 0.02]} />
          <meshStandardMaterial
            color={b.color}
            emissive={new THREE.Color(b.color)}
            emissiveIntensity={1.1}
            roughness={0.3}
            metalness={0.35}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Round gauges */}
      {[-0.68, 0.68].map((x, i) => (
        <group key={x} position={[x, -0.23, Z + 0.055]} rotation={[TILT, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 20]} />
            {metal('#15171a', 0.5, 0.5)}
          </mesh>
          <mesh position={[0, 0.012, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.008, 20]} />
            <meshStandardMaterial
              color="#05140c"
              emissive={new THREE.Color(i === 0 ? '#00ff88' : '#ffcc33')}
              emissiveIntensity={1.1}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, 0.02, 0.02]} rotation={[0, 0, i === 0 ? 0.5 : -0.35]}>
            <boxGeometry args={[0.008, 0.05, 0.004]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Throttle (right) */}
      <group position={[0.58, -0.32, Z + 0.05]}>
        <mesh>
          <boxGeometry args={[0.12, 0.04, 0.08]} />
          {metal('#2a2d32', 0.5, 0.6)}
        </mesh>
        <group position={[0.03, 0.03, 0]} rotation={[0.55, 0, 0]}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.1, 8]} />
            {metal('#6a6e74', 0.35, 0.75)}
          </mesh>
          <mesh position={[0, 0.11, 0]}>
            <sphereGeometry args={[0.022, 10, 10]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.6} />
          </mesh>
        </group>
      </group>

      {/* Stick (left) */}
      <group position={[-0.58, -0.32, Z + 0.05]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.05, 0.04, 12]} />
          {metal('#2a2d32', 0.5, 0.6)}
        </mesh>
        <mesh position={[0, 0.07, 0.01]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
          {metal('#6a6e74', 0.35, 0.75)}
        </mesh>
        <mesh position={[0, 0.14, 0.03]}>
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshStandardMaterial color="#c0392b" roughness={0.35} metalness={0.4} />
        </mesh>
      </group>
    </group>
  )
}
