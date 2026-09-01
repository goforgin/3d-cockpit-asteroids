import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { wrapDelta } from '../../game/math'
import { PLAY_SPACE_SIZE } from '../../game/constants'

// A red targeting reticle anchored to the locked asteroid's 3D position, so it
// tracks the rock on screen as the ship and asteroid move. Rendered inside the
// Canvas via drei's <Html> which projects the world point to screen space.
export const LockReticle = () => {
  const groupRef = useRef<THREE.Group>(null!)
  const lockedId = useGameStore((s) => s.state.lockedAsteroidId)

  useFrame(() => {
    if (!lockedId || !groupRef.current) return
    const ast = useGameStore
      .getState()
      .state.asteroids.find((a) => a.id === lockedId)
    if (ast) {
      const ship = useGameStore.getState().state.ship.position
      groupRef.current.visible = true
      groupRef.current.position.set(
        ship.x + wrapDelta(ast.position.x - ship.x, PLAY_SPACE_SIZE),
        ship.y + wrapDelta(ast.position.y - ship.y, PLAY_SPACE_SIZE),
        ship.z + wrapDelta(ast.position.z - ship.z, PLAY_SPACE_SIZE)
      )
    } else {
      groupRef.current.visible = false
    }
  })

  if (!lockedId) return null

  const bracket = {
    position: 'absolute' as const,
    width: 12,
    height: 12,
    borderColor: 'rgba(255,40,40,0.95)',
    borderStyle: 'solid' as const,
    filter: 'drop-shadow(0 0 4px rgba(255,0,0,0.9))',
  }

  return (
    <group ref={groupRef}>
      <Html center zIndexRange={[40, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ position: 'relative', width: 44, height: 44 }}>
          {/* Corner brackets */}
          <div style={{ ...bracket, top: 0, left: 0, borderWidth: '2px 0 0 2px' }} />
          <div style={{ ...bracket, top: 0, right: 0, borderWidth: '2px 2px 0 0' }} />
          <div style={{ ...bracket, bottom: 0, left: 0, borderWidth: '0 0 2px 2px' }} />
          <div style={{ ...bracket, bottom: 0, right: 0, borderWidth: '0 2px 2px 0' }} />
          {/* Center dot */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 3,
              height: 3,
              transform: 'translate(-50%, -50%)',
              background: 'rgba(255,40,40,0.95)',
              borderRadius: '50%',
              boxShadow: '0 0 4px rgba(255,0,0,0.9)',
            }}
          />
          {/* LOCK label */}
          <div
            style={{
              position: 'absolute',
              top: -16,
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(255,40,40,0.95)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 2,
              fontFamily: "'Orbitron', monospace",
              textShadow: '0 0 6px rgba(255,0,0,0.9)',
              whiteSpace: 'nowrap',
            }}
          >
            LOCK
          </div>
        </div>
      </Html>
    </group>
  )
}
