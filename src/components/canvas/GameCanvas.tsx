import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Scene } from './Scene'

export const GameCanvas = () => {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 75, position: [0, 0, 0] }}
      shadows
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
