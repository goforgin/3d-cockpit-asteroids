import { EffectComposer } from '@react-three/postprocessing'
import { Bloom } from '@react-three/postprocessing'
import { Vignette } from '@react-three/postprocessing'
import { Component, ReactNode } from 'react'
import { UnsignedByteType } from 'three'

const Composer = () => (
  // Unsigned byte + no MSAA: HDR half-float + additive bursts stored Inf
  // in the composer buffer and bloomed the whole view into a stuck white
  // screen. 8x MSAA on top of four aux cameras was also enough to hang the GPU.
  <EffectComposer multisampling={0} frameBufferType={UnsignedByteType}>
    <Bloom
      intensity={0.35}
      radius={0.28}
      luminanceThreshold={0.92}
      luminanceSmoothing={0.9}
    />
    <Vignette
      offset={0.4}
      darkness={0.45}
    />
  </EffectComposer>
)

class EffectsGuard extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

export const Effects = () => (
  <EffectsGuard>
    <Composer />
  </EffectsGuard>
)
