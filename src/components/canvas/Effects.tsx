import { EffectComposer } from '@react-three/postprocessing'
import { Bloom } from '@react-three/postprocessing'
import { Vignette } from '@react-three/postprocessing'
import { ToneMapping } from '@react-three/postprocessing'

export const Effects = () => {
  return (
    <EffectComposer>
      {/* ACES Filmic tone mapping for cinematic look */}
      <ToneMapping />
      {/* Enhanced bloom for lasers and emissives */}
      <Bloom
        intensity={0.8}
        radius={0.5}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
      />
      {/* Vignette for cockpit feel */}
      <Vignette
        offset={0.4}
        darkness={0.45}
      />
    </EffectComposer>
  )
}
