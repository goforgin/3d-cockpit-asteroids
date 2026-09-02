import { EffectComposer } from '@react-three/postprocessing'
import { Bloom } from '@react-three/postprocessing'
import { Vignette } from '@react-three/postprocessing'
import { ToneMapping } from '@react-three/postprocessing'
import { UnsignedByteType } from 'three'

export const Effects = () => {
  return (
    // Unsigned byte + no MSAA: HDR half-float + additive bursts stored Inf
    // in the composer buffer and bloomed the whole view into a stuck white
    // screen. 8x MSAA on top of four aux cameras was also enough to hang the GPU.
    <EffectComposer multisampling={0} frameBufferType={UnsignedByteType}>
      <ToneMapping />
      <Bloom
        intensity={0.4}
        radius={0.3}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.9}
      />
      <Vignette
        offset={0.4}
        darkness={0.45}
      />
    </EffectComposer>
  )
}
