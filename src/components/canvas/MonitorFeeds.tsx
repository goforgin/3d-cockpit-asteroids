import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../store/gameStore'
import { getMonitorCanvas, MONITOR_SIZE, type MonitorId } from '../../game/monitorRegistry'

const W = MONITOR_SIZE.w
const H = MONITOR_SIZE.h

const OFFSETS: Record<MonitorId, number> = {
  left: -Math.PI / 2,
  front: 0,
  back: Math.PI,
  right: Math.PI / 2,
}

const IDS: MonitorId[] = ['left', 'front', 'back', 'right']

interface Feed {
  camera: THREE.PerspectiveCamera
  rt: THREE.WebGLRenderTarget
  buf: Uint8Array
  img: ImageData
}

// Live aux cameras. MUST be a real function component so useFrame/useEffect
// run inside <Canvas>. The previous version called those hooks at module
// scope, which crashes React into a blank white page.
export const MonitorFeeds = () => {
  const feedsRef = useRef<Record<MonitorId, Feed> | null>(null)

  useEffect(() => {
    const make = (): Feed => {
      const camera = new THREE.PerspectiveCamera(65, W / H, 0.5, 5000)
      camera.rotation.order = 'YXZ'
      const rt = new THREE.WebGLRenderTarget(W, H)
      rt.texture.colorSpace = THREE.SRGBColorSpace
      return {
        camera,
        rt,
        buf: new Uint8Array(W * H * 4),
        img: new ImageData(W, H),
      }
    }
    feedsRef.current = {
      left: make(),
      front: make(),
      back: make(),
      right: make(),
    }
    return () => {
      if (!feedsRef.current) return
      for (const f of Object.values(feedsRef.current)) f.rt.dispose()
      feedsRef.current = null
    }
  }, [])

  useFrame((state) => {
    try {
    const feeds = feedsRef.current
    if (!feeds) return
    if (useGameStore.getState().state.gameState !== 'playing') return
    const gs = useGameStore.getState().state
    // Skip aux cameras during the death flash — additive debris at the camera
    // is what turned the whole screen white on ship destroy.
    if (Date.now() < gs.shipHitAt + 1600) return
    // Also skip while a burst is on screen so additive particles never leak
    // into the offscreen gl.render() path.
    if (gs.explosions.length > 0) return

    const { gl, scene } = state
    const ship = useGameStore.getState().state.ship

    const cockpit = scene.getObjectByName('cockpit')
    const lock = scene.getObjectByName('lock-reticle')
    const stars = scene.getObjectByName('starfield')
    const shield = scene.getObjectByName('shield-bubble')
    const explosions = scene.getObjectByName('explosions')

    const prevTarget = gl.getRenderTarget()
    const prevAutoClear = gl.autoClear

    // Always restore GL + visibility. The shield uses AdditiveBlending; if we
    // leave that blend mode on after gl.render(), the main view (and
    // EffectComposer) composite additively and the screen goes white. That can
    // also hang the GPU so a normal refresh looks like it "does nothing".
    try {
      if (cockpit) cockpit.visible = false
      if (lock) lock.visible = false
      if (stars) stars.visible = false
      if (shield) shield.visible = false
      if (explosions) explosions.visible = false

      gl.autoClear = true

      for (const id of IDS) {
        const feed = feeds[id]
        feed.camera.position.set(ship.position.x, ship.position.y, ship.position.z)
        feed.camera.rotation.set(ship.rotation.pitch, ship.rotation.yaw + OFFSETS[id], 0, 'YXZ')

        gl.setRenderTarget(feed.rt)
        gl.setClearColor(0x000000, 1)
        gl.clear()
        gl.render(scene, feed.camera)

        const canvas = getMonitorCanvas(id)
        const ctx = canvas?.getContext('2d')
        if (ctx) {
          gl.readRenderTargetPixels(feed.rt, 0, 0, W, H, feed.buf)
          for (let y = 0; y < H; y++) {
            const src = (H - 1 - y) * W * 4
            feed.img.data.set(feed.buf.subarray(src, src + W * 4), y * W * 4)
          }
          ctx.putImageData(feed.img, 0, 0)
        }
      }
    } finally {
      gl.setRenderTarget(prevTarget)
      gl.autoClear = prevAutoClear
      gl.setClearColor(0x000000, 1)
      gl.setViewport(0, 0, gl.domElement.width, gl.domElement.height)
      gl.setScissorTest(false)
      gl.resetState()
      const ctx = gl.getContext()
      ctx.disable(ctx.BLEND)
      ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA)
      ctx.blendEquation(ctx.FUNC_ADD)

      if (cockpit) cockpit.visible = true
      if (lock) lock.visible = true
      if (stars) stars.visible = true
      if (explosions) explosions.visible = true
      // Shield visibility is owned by ShieldBubble's useFrame; don't force it on.
    }
    } catch {
      // Dashboard cameras are optional. A WebGL readback failure in Chrome
      // must not take down the main view.
    }
  }, -1)

  return null
}
