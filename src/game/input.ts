// Keyboard input state

type KeyState = {
  pressed: boolean
  held: boolean
  duration: number
}

export class InputManager {
  private keys: Record<string, KeyState> = {}
  
  constructor() {
    window.addEventListener('keydown', (e) => this.handleKey(e, true))
    window.addEventListener('keyup', (e) => this.handleKey(e, false))
    // If focus is lost (e.g. Alt opened an OS menu), release everything so no
    // key stays stuck "held".
    window.addEventListener('blur', () => this.clearAll())
  }
  
  private handleKey(e: KeyboardEvent, isDown: boolean) {
    // Normalize to a stable key name. e.key for the Alt/Option key is 'Alt',
    // for the spacebar it is ' '. We intentionally do NOT key off e.altKey,
    // because that would mislabel every other key pressed while Alt is held.
    const key = e.key.toLowerCase()

    // Prevent default for game keys to avoid page scroll / menu focus
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'x', 'shift', 'z'].includes(key)) {
      e.preventDefault()
    }

    if (!this.keys[key]) {
      this.keys[key] = { pressed: false, held: false, duration: 0 }
    }

    const keyState = this.keys[key]
    if (isDown) {
      keyState.pressed = true
      keyState.held = true
      keyState.duration = 0
    } else {
      keyState.pressed = false
      keyState.held = false
      keyState.duration = 0
    }
  }

  // Clear all held keys — used when the window loses focus so a key whose
  // keyup never arrived (common with Alt) doesn't get stuck.
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
