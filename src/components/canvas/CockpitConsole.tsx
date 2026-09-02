import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// A detailed lower control console that frames the bottom of the view like a
// real cockpit: a curved dashboard shelf, multi-function display screens with
// scrolling glow, clusters of backlit buttons, round gauges, and a throttle
// quadrant. Authored in the cockpit's local frame (+z = forward, +y = up), so
// it sits below the pilot's sightline and never blocks the crosshair.
export const CockpitConsole = () => {
  const screenMat = useRef<THREE.MeshStandardMaterial>(null!)

  useFrame((state) => {
    // Gentle brightness flicker on the MFD screens.
    if (screenMat.current) {
      screenMat.current.emissiveIntensity =
        0.7 + 0.25 * Math.sin(state.clock.elapsedTime * 2.3)
    }
  })

  // Curved dashboard shelf built from angled segments.
  const shelf = useMemo(() => {
    const segs: { pos: [number, number, number]; rot: [number, number, number] }[] = []
    const n = 7
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1) - 0.5) * 2 // -1..1
      const x = t * 1.15
      const yaw = -t * 0.5
      segs.push({ pos: [x, -0.78, 0.52 - Math.abs(t) * 0.12], rot: [-Math.PI / 2.4, yaw, 0] })
    }
    return segs
  }, [])

  // Backlit button grid on the dash.
  const buttons = useMemo(() => {
    const out: { pos: [number, number, number]; color: string }[] = []
    const colors = ['#00e5ff', '#00ff88', '#ffcc33', '#ff5566']
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 6; c++) {
        out.push({
          pos: [-0.55 + c * 0.16, -0.86 + r * 0.06, 0.66 - r * 0.02],
          color: colors[(r * 6 + c) % colors.length],
        })
      }
    }
    return out
  }, [])

  const metal = (color: string, rough = 0.4, metalness = 0.8) => (
    <meshStandardMaterial color={color} roughness={rough} metalness={metalness} />
  )

  return (
    <group>
      {/* Curved dashboard shelf */}
      {shelf.map((s, i) => (
        <mesh key={`shelf-${i}`} position={s.pos} rotation={s.rot}>
          <boxGeometry args={[0.42, 0.5, 0.08]} />
          {metal('#26292e', 0.5, 0.75)}
        </mesh>
      ))}

      {/* Raised binnacle behind the shelf holding the screens */}
      <mesh position={[0, -0.5, 0.34]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[2.5, 0.6, 0.12]} />
        {metal('#1c1e22', 0.6, 0.6)}
      </mesh>

      {/* Three MFD screens */}
      {[
        { x: -0.78, w: 0.62, color: '#0a2a33', em: '#00e5ff' },
        { x: 0, w: 0.78, color: '#0a2a1e', em: '#00ff88' },
        { x: 0.78, w: 0.62, color: '#0a1f33', em: '#3388ff' },
      ].map((mfd, i) => (
        <group key={`mfd-${i}`} position={[mfd.x, -0.5, 0.41]} rotation={[-0.5, 0, 0]}>
          {/* bezel */}
          <mesh>
            <boxGeometry args={[mfd.w + 0.06, 0.42, 0.04]} />
            {metal('#0b0c0e', 0.7, 0.5)}
          </mesh>
          {/* screen */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[mfd.w, 0.34, 0.02]} />
            <meshStandardMaterial
              ref={i === 1 ? screenMat : undefined}
              color={mfd.color}
              emissive={new THREE.Color(mfd.em)}
              emissiveIntensity={0.75}
              roughness={0.25}
              metalness={0.1}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Backlit buttons */}
      {buttons.map((b, i) => (
        <mesh key={`btn-${i}`} position={b.pos} rotation={[-Math.PI / 2.4, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.05]} />
          <meshStandardMaterial
            color={b.color}
            emissive={new THREE.Color(b.color)}
            emissiveIntensity={0.6}
            roughness={0.3}
            metalness={0.4}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Round gauges on the outer dash */}
      {[-1.0, 1.0].map((x, i) => (
        <group key={`gauge-${i}`} position={[x, -0.8, 0.5]} rotation={[-Math.PI / 2.4, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.13, 0.04, 20]} />
            {metal('#0c0d0f', 0.6, 0.5)}
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.01, 20]} />
            <meshStandardMaterial
              color="#0a1a12"
              emissive={new THREE.Color(i === 0 ? '#00ff88' : '#ffcc33')}
              emissiveIntensity={0.5}
              toneMapped={false}
            />
          </mesh>
          {/* needle */}
          <mesh position={[0, 0.035, 0.03]} rotation={[0, 0, i === 0 ? 0.6 : -0.4]}>
            <boxGeometry args={[0.012, 0.09, 0.005]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Throttle quadrant on the right */}
      <group position={[1.15, -0.85, 0.62]}>
        <mesh>
          <boxGeometry args={[0.18, 0.06, 0.3]} />
          {metal('#17181b', 0.6, 0.6)}
        </mesh>
        {[-0.06, 0.06].map((lx, i) => (
          <group key={`lever-${i}`} position={[lx, 0.02, 0.02]} rotation={[0.5 - i * 0.2, 0, 0]}>
            <mesh position={[0, 0.09, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
              {metal('#3a3d42', 0.4, 0.7)}
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshStandardMaterial color={i === 0 ? '#ff5566' : '#00e5ff'} roughness={0.3} metalness={0.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Center pedestal / joystick base on the left */}
      <group position={[-1.15, -0.85, 0.62]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.1, 0.1, 16]} />
          {metal('#17181b', 0.6, 0.6)}
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.24, 10]} />
          {metal('#3a3d42', 0.4, 0.7)}
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.05, 14, 14]} />
          <meshStandardMaterial color="#c0392b" roughness={0.35} metalness={0.4} />
        </mesh>
      </group>
    </group>
  )
}
