import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { isShieldActive } from '../../game/shieldSystem'

// The camera sits inside the ship, so a solid sphere would tint the whole view.
// Instead we render a Fresnel "rim" shield: transparent where you're looking
// (center of screen) and glowing only at grazing angles (the screen edges),
// which reads as an energy bubble around the cockpit without blocking aim.
const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDir)));
    float glow = pow(rim, 2.5) * uIntensity;
    gl_FragColor = vec4(uColor, glow);
  }
`

export const ShieldBubble = () => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const matRef = useRef<THREE.ShaderMaterial>(null!)

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#33ccff') },
      uIntensity: { value: 1.0 },
    }),
    []
  )

  useFrame((state) => {
    const ship = useGameStore.getState().state.ship
    const active = isShieldActive(ship, Date.now())

    if (meshRef.current) {
      meshRef.current.visible = active
      meshRef.current.position.set(ship.position.x, ship.position.y, ship.position.z)
    }

    if (active && matRef.current) {
      // Pulse the rim brightness while the shield is up
      const pulse = 0.8 + 0.6 * (0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 6))
      matRef.current.uniforms.uIntensity.value = pulse
    }
  })

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[4, 32, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}
