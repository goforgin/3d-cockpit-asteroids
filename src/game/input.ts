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
  }
  
  private handleKey(e: KeyboardEvent, isDown: boolean) {
    // Prevent default for game keys to avoid page scroll
    const key = e.key.toLowerCase()
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'alt', 'shift', 'z'].includes(key)) {
      e.preventDefault()
    }
    
    // Handle Alt key - check both e.key and e.altKey
    let keyName = key
    if (e.key === 'Alt' || e.altKey) {
      keyName = 'alt'
    }
    
    if (!this.keys[keyName]) {
      this.keys[keyName] = { pressed: false, held: false, duration: 0 }
    }
    
    const keyState = this.keys[keyName]
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
