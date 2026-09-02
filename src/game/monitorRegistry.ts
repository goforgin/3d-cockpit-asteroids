// Monitor registry for live camera feeds on dashboard monitors
// Plain TS module, no React context, no Zustand

export type MonitorId = 'left' | 'front' | 'back' | 'right'

export const MONITOR_SIZE = { w: 140, h: 90 }

// Module-level map: MonitorId -> HTMLCanvasElement | null
const monitorCanvases = new Map<MonitorId, HTMLCanvasElement | null>()

export const registerMonitor = (id: MonitorId, canvas: HTMLCanvasElement | null) => {
  monitorCanvases.set(id, canvas)
}

export const unregisterMonitor = (id: MonitorId) => {
  monitorCanvases.delete(id)
}

export const getMonitorCanvas = (id: MonitorId): HTMLCanvasElement | null => {
  return monitorCanvases.get(id) || null
}
