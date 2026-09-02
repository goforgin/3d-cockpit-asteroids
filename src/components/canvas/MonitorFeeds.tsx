// MonitorFeeds.tsx - Renders live camera feeds to dashboard monitors
// This component is INSIDE the Canvas, so it can use useFrame and WebGL APIs

import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../../store/gameStore'
import { getMonitorCanvas, MONITOR_SIZE, type MonitorId } from '../../game/monitorRegistry'
import * as THREE from 'three'

// Monitor dimensions
const MONITOR_W = MONITOR_SIZE.w
const MONITOR_H = MONITOR_SIZE.h

// Camera offsets for each monitor
const MONITOR_OFFSETS: Record<string, number> = {
  left: -Math.PI / 2,
  front: 0,
  back: Math.PI,
  right: Math.PI / 2,
}

// Camera and render target storage
interface MonitorData {
  camera: THREE.PerspectiveCamera
  rt: THREE.WebGLRenderTarget
  buf: Uint8Array
  imgData: ImageData
}

let monitorData: Record<string, MonitorData> | null = null

// Initialize monitor data once
const initMonitorData = (): Record<string, MonitorData> => {
  if (monitorData) return monitorData

  const fov = 65
  const near = 0.5
  const far = 5000

  monitorData = {
    left: createMonitorData('left', fov, near, far),
    front: createMonitorData('front', fov, near, far),
    back: createMonitorData('back', fov, near, far),
    right: createMonitorData('right', fov, near, far),
  }

  return monitorData
}

const createMonitorData = (_id: MonitorId, fov: number, near: number, far: number): MonitorData => {
  const camera = new THREE.PerspectiveCamera(fov, MONITOR_W / MONITOR_H, near, far)
  camera.rotation.order = 'YXZ'

  const rt = new THREE.WebGLRenderTarget(MONITOR_W, MONITOR_H)
  rt.texture.colorSpace = THREE.SRGBColorSpace

  const buf = new Uint8Array(MONITOR_W * MONITOR_H * 4)
  const imgData = new ImageData(MONITOR_W, MONITOR_H)

  return { camera, rt, buf, imgData }
}

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (monitorData) {
      Object.values(monitorData).forEach((m) => m.rt.dispose())
      monitorData = null
    }
  }
}, [])

// Main render loop
useFrame((state) => {
  const { gl, scene } = state
  const gameState = useGameStore.getState().state.gameState

  // Only render when playing
  if (gameState !== 'playing') return

  // Initialize monitor data if needed
  const data = initMonitorData()

  // Get ship position and rotation
  const ship = useGameStore.getState().state.ship
  const shipPos = ship.position
  const shipYaw = ship.rotation.yaw
  const shipPitch = ship.rotation.pitch

  // Hide cockpit so monitors don't show interior
  const cockpit = scene.getObjectByName('cockpit')
  if (cockpit) {
    ;(cockpit as THREE.Group).visible = false
  }

  // Save previous render target
  const prev = gl.getRenderTarget()

  // Render each monitor
  Object.entries(data).forEach(([id, monitor]) => {
    const { camera, rt, buf, imgData } = monitor

    // Set camera position and rotation
    camera.position.set(shipPos.x, shipPos.y, shipPos.z)
    const yawOffset = MONITOR_OFFSETS[id]
    camera.rotation.set(shipPitch, shipYaw + yawOffset, 0, 'YXZ')

    // Render to render target
    gl.setRenderTarget(rt)
    gl.setClearColor(0x000000, 1)
    gl.clear()

    // Render scene (without cockpit)
    gl.render(scene, camera)

    // Blit to HUD canvas
    const canvas = getMonitorCanvas(id as MonitorId)
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Read pixels from render target
        gl.readRenderTargetPixels(rt, 0, 0, MONITOR_W, MONITOR_H, buf)

        // Flip Y (WebGL origin is bottom-left, canvas is top-left)
        for (let y = 0; y < MONITOR_H; y++) {
          const src = (MONITOR_H - 1 - y) * MONITOR_W * 4
          const dst = y * MONITOR_W * 4
          imgData.data.set(buf.subarray(src, src + MONITOR_W * 4), dst)
        }

        ctx.putImageData(imgData, 0, 0)
      }
    }
  })

  // Restore previous render target
  gl.setRenderTarget(prev)

  // Show cockpit again
  if (cockpit) {
    ;(cockpit as THREE.Group).visible = true
  }
}, -1) // Priority -1: runs before R3F's main render

// Export empty component - all logic is in hooks
export const MonitorFeeds = () => null
