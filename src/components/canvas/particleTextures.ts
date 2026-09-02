import * as THREE from 'three'

// Shared procedural sprites. PointsMaterial without a map draws a square;
// these are circular / cloudy so bursts read as fire and dust, not pixels.

const makeTexture = (draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 128) => {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D context unavailable')
  draw(ctx, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = false
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.colorSpace = THREE.NoColorSpace
  return tex
}

let glow: THREE.CanvasTexture | null = null
let smoke: THREE.CanvasTexture | null = null

export const getGlowTexture = (): THREE.CanvasTexture => {
  if (glow) return glow
  glow = makeTexture((ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.18, 'rgba(255,255,255,0.95)')
    g.addColorStop(0.42, 'rgba(255,255,255,0.45)')
    g.addColorStop(0.7, 'rgba(255,255,255,0.08)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
  }, 64)
  return glow
}

export const getSmokeTexture = (): THREE.CanvasTexture => {
  if (smoke) return smoke
  smoke = makeTexture((ctx, s) => {
    ctx.clearRect(0, 0, s, s)
    ctx.globalCompositeOperation = 'lighter'
    const blobs = [
      [0.5, 0.5, 0.38, 0.55],
      [0.38, 0.42, 0.28, 0.35],
      [0.62, 0.4, 0.24, 0.32],
      [0.44, 0.62, 0.26, 0.3],
      [0.6, 0.58, 0.22, 0.28],
      [0.5, 0.34, 0.2, 0.22],
    ] as const
    for (const [nx, ny, nr, a] of blobs) {
      const cx = nx * s
      const cy = ny * s
      const r = nr * s
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      g.addColorStop(0, `rgba(255,255,255,${a})`)
      g.addColorStop(0.45, `rgba(255,255,255,${a * 0.35})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, s, s)
    }
    ctx.globalCompositeOperation = 'destination-in'
    const mask = ctx.createRadialGradient(s / 2, s / 2, s * 0.12, s / 2, s / 2, s * 0.48)
    mask.addColorStop(0, 'rgba(0,0,0,1)')
    mask.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = mask
    ctx.fillRect(0, 0, s, s)
  }, 128)
  return smoke
}
