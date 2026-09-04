// Keyboard input state. Normalized by both `e.code` (layout-stable) and
// `e.key` (including legacy Safari 'Up' / 'Spacebar') so Mac Safari and
// Chrome see the same names.

type KeyState = {
  pressed: boolean
  held: boolean
  duration: number
}

const GAME_KEYS = new Set([
  'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
  'up', 'down', 'left', 'right',
  'w', 'a', 's', 'd',
  ' ', 'space', 'x', 'z', 'shift', 'enter', 'escape', 'm',
])

const CODE_ALIASES: Record<string, string[]> = {
  ArrowUp: ['arrowup', 'up'],
  ArrowDown: ['arrowdown', 'down'],
  ArrowLeft: ['arrowleft', 'left'],
  ArrowRight: ['arrowright', 'right'],
  KeyW: ['w', 'arrowup', 'up'],
  KeyA: ['a', 'arrowleft', 'left'],
  KeyS: ['s', 'arrowdown', 'down'],
  KeyD: ['d', 'arrowright', 'right'],
  KeyX: ['x'],
  KeyZ: ['z'],
  KeyM: ['m'],
  Space: [' ', 'space'],
  ShiftLeft: ['shift'],
  ShiftRight: ['shift'],
  Enter: ['enter'],
  NumpadEnter: ['enter'],
  Escape: ['escape'],
}

export class InputManager {
  private keys: Record<string, KeyState> = {}

  constructor() {
    const opts: AddEventListenerOptions = { capture: true }
    window.addEventListener('keydown', (e) => this.handleKey(e, true), opts)
    window.addEventListener('keyup', (e) => this.handleKey(e, false), opts)
    window.addEventListener('blur', () => this.clearAll())
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.clearAll()
    })
  }

  private namesFor(e: KeyboardEvent): string[] {
    const names = new Set<string>()
    const key = (e.key || '').toLowerCase()
    if (key) names.add(key)
    if (key === ' ' || key === 'spacebar' || key === 'space') {
      names.add(' ')
      names.add('space')
    }
    // Pre-Chromium Safari used 'Up' / 'Down' / 'Left' / 'Right'.
    if (key === 'up' || key === 'down' || key === 'left' || key === 'right') {
      names.add(`arrow${key}`)
    }
    for (const n of CODE_ALIASES[e.code] || []) names.add(n)
    return [...names]
  }

  private handleKey(e: KeyboardEvent, isDown: boolean) {
    // Let browser shortcuts (reload, etc.) through.
    if (e.metaKey || e.ctrlKey) return

    const names = this.namesFor(e)
    if (names.some((n) => GAME_KEYS.has(n))) {
      e.preventDefault()
    }

    for (const name of names) {
      if (!this.keys[name]) {
        this.keys[name] = { pressed: false, held: false, duration: 0 }
      }
      const keyState = this.keys[name]
      if (isDown) {
        // Key-repeat must not look like a fresh press — that's how holding Z
        // kept re-arming the shield, and how Safari auto-repeat felt "stuck".
        if (!e.repeat) keyState.pressed = true
        keyState.held = true
      } else {
        keyState.pressed = false
        keyState.held = false
        keyState.duration = 0
      }
    }
  }

  public clearAll() {
    for (const key in this.keys) {
      this.keys[key].pressed = false
      this.keys[key].held = false
      this.keys[key].duration = 0
    }
  }

  public update(deltaTime: number) {
    for (const key in this.keys) {
      if (this.keys[key].held) {
        this.keys[key].duration += deltaTime
      }
    }
  }

  public isKeyDown(key: string): boolean {
    return this.keys[key]?.pressed || false
  }

  public isKeyHeld(key: string): boolean {
    return this.keys[key]?.held || false
  }

  public getKeyDuration(key: string): number {
    return this.keys[key]?.duration || 0
  }

  public resetPressed() {
    for (const key in this.keys) {
      this.keys[key].pressed = false
    }
  }
}

export const inputManager = new InputManager()
