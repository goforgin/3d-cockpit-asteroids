import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// A detailed control console framing the bottom of the view like a real
// cockpit: a hood rail, multi-function display screens with a glow flicker,
// clusters of backlit buttons, round gauges, and throttle/stick grips.
//
// Authored in the cockpit's local frame (+z = forward, +y = up). The camera has
// a ~75deg vertical FOV, so at z~0.45 the view only reaches down to about
// y=-0.35. Everything here lives in y ∈ [-0.08, -0.42] so it reads as a
// dashboard along the lower third WITHOUT covering the centered crosshair.
export const CockpitConsole = () => {
  const screenMat = useRef<THREE.MeshStandardMaterial>(null!)

  useFrame((state) => {
    if (screenMat.current) {
      screenMat.current.emissiveIntensity =
        0.8 + 0.3 * Math.sin(state.clock.elapsedTime * 2.3)
    }
  })

  const buttons = useMemo(() => {
    const out: { pos: [number, number, number]; color: string }[] = []
    const colors = ['#00e5ff', '#00ff88', '#ffcc33', '#ff5566']
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 6; c++) {
        out.push({
          pos: [-0.42 + c * 0.17, -0.32 - r * 0.05, 0.55],
          color: colors[(r * 6 + c) % colors.length],
        })
      }
    }
    return out
  }, [])

  const metal = (color: string, rough = 0.45, metalness = 0.75) => (
    <meshStandardMaterial color={color} roughness={rough} metalness={metalness} />
  )

  const TILT = -0.4

  return (
    <group>
      {/* Hood / cowl rail — the top edge of the dashboard, just below center */}
      <mesh position={[0, -0.09, 0.42]} rotation={[TILT, 0, 0]}>
        <boxGeometry args={[2.7, 0.07, 0.28]} />
        {metal('#303338', 0.5, 0.7)}
      </mesh>

      {/* Main binnacle that holds the screens */}
      <mesh position={[0, -0.24, 0.4]} rotation={[TILT, 0, 0]}>
        <boxGeometry args={[2.6, 0.34, 0.12]} />
        {metal('#1c1e22', 0.6, 0.55)}
      </mesh>

      {/* Three MFD screens */}
      {[
        { x: -0.75, w: 0.6, color: '#0a2a33', em: '#00e5ff' },
        { x: 0, w: 0.74, color: '#0a2a1e', em: '#00ff88' },
        { x: 0.75, w: 0.6, color: '#0a1f33', em: '#3388ff' },
      ].map((mfd, i) => (
        <group key={`mfd-${i}`} position={[mfd.x, -0.23, 0.47]} rotation={[TILT, 0, 0]}>
          <mesh>
            <boxGeometry args={[mfd.w + 0.05, 0.26, 0.03]} />
            {metal('#0b0c0e', 0.7, 0.4)}
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[mfd.w, 0.2, 0.02]} />
            <meshStandardMaterial
              ref={i === 1 ? screenMat : undefined}
              color={mfd.color}
              emissive={new THREE.Color(mfd.em)}
              emissiveIntensity={0.85}
              roughness={0.25}
              metalness={0.1}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Backlit buttons below the screens */}
      {buttons.map((b, i) => (
        <mesh key={`btn-${i}`} position={b.pos} rotation={[TILT, 0, 0]}>
          <boxGeometry args={[0.11, 0.09, 0.05]} />
          <meshStandardMaterial
            color={b.color}
            emissive={new THREE.Color(b.color)}
            emissiveIntensity={0.7}
            roughness={0.3}
            metalness={0.4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Round gauges in the lower corners */}
      {[-1.18, 1.18].map((x, i) => (
        <group key={`gauge-${i}`} position={[x, -0.18, 0.48]} rotation={[TILT, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.14, 0.14, 0.04, 22]} />
            {metal('#0c0d0f', 0.6, 0.5)}
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.01, 22]} />
            <meshStandardMaterial
              color="#0a1a12"
              emissive={new THREE.Color(i === 0 ? '#00ff88' : '#ffcc33')}
              emissiveIntensity={0.6}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, 0.035, 0.03]} rotation={[0, 0, i === 0 ? 0.6 : -0.4]}>
            <boxGeometry args={[0.014, 0.1, 0.006]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Throttle quadrant (right) */}
      <group position={[0.95, -0.22, 0.55]}>
        <mesh>
          <boxGeometry args={[0.2, 0.06, 0.24]} />
          {metal('#17181b', 0.6, 0.6)}
        </mesh>
        {[-0.06, 0.06].map((lx, i) => (
          <group key={`lever-${i}`} position={[lx, 0.04, 0.0]} rotation={[0.5 - i * 0.25, 0, 0]}>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.16, 8]} />
              {metal('#3a3d42', 0.4, 0.7)}
            </mesh>
            <mesh position={[0, 0.17, 0]}>
              <sphereGeometry args={[0.032, 12, 12]} />
              <meshStandardMaterial color={i === 0 ? '#ff5566' : '#00e5ff'} roughness={0.3} metalness={0.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Control stick (left) */}
      <group position={[-0.95, -0.24, 0.55]}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.11, 0.08, 16]} />
          {metal('#17181b', 0.6, 0.6)}
        </mesh>
        <mesh position={[0, 0.13, 0]} rotation={[0.25, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.2, 10]} />
          {metal('#3a3d42', 0.4, 0.7)}
        </mesh>
        <mesh position={[0, 0.24, 0.03]}>
          <sphereGeometry args={[0.05, 14, 14]} />
          <meshStandardMaterial color="#c0392b" roughness={0.35} metalness={0.4} />
        </mesh>
      </group>
    </group>
  )
}
