import { Canvas } from '@react-three/fiber'
import { Component, ReactNode, Suspense, useState } from 'react'
import { Scene } from './Scene'

class CanvasErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

export const GameCanvas = () => {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black text-cyan-300 font-mono text-center px-6">
        <div>
          <p className="text-lg mb-2">WebGL failed to start in this browser.</p>
          <p className="text-sm text-cyan-500/80">
            Try Safari, or in Chrome visit chrome://settings/system and turn on
            hardware acceleration, then reopen this tab.
          </p>
        </div>
      </div>
    )
  }

  return (
    <CanvasErrorBoundary onError={() => setFailed(true)}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 75, position: [0, 0, 0], near: 0.12, far: 5000 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
          stencil: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 1)
          const canvas = gl.domElement
          canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            setFailed(true)
          })
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </CanvasErrorBoundary>
  )
}
