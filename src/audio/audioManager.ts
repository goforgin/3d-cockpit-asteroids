import { Howl } from 'howler'

// Audio file paths (relative to public/audio/)
const AUDIO_FILES = {
  laser: 'laser.mp3',
  explosion: 'explosion.mp3',
  shipExplode: 'ship_explode.mp3',
  thrust: 'thrust.mp3',
  shieldOn: 'shield_on.mp3',
  shieldHit: 'shield_hit.mp3',
  hyperspace: 'hyperspace.mp3',
  extraLife: 'extra_life.mp3',
} as const

// Web Audio API fallback synthesizer
class FallbackSynthesizer {
  private ctx: AudioContext | null = null
  private thrustOsc: OscillatorNode | null = null
  private thrustGain: GainNode | null = null
  private thrustNode: AudioNode | null = null

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.warn('Web Audio API not supported')
        throw new Error('Audio not supported')
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  // Force-create and resume the context. Must be called from within a user
  // gesture (e.g. a keydown handler) to satisfy browser autoplay policies.
  resume() {
    try {
      this.ensureContext()
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Short laser pew sound
  playLaser() {
    try {
      const ctx = this.ensureContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1)

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Crunch explosion sound
  playExplosion() {
    try {
      const ctx = this.ensureContext()
      const bufferSize = ctx.sampleRate * 0.4
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1000

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      noise.start()
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Bass thump for ship explosion
  playShipExplode() {
    try {
      const ctx = this.ensureContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(100, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.5)

      gain.gain.setValueAtTime(0.8, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Start thrust loop
  startThrust() {
    try {
      const ctx = this.ensureContext()

      // Stop existing thrust if any
      this.stopThrust()

      // Create low rumble
      this.thrustOsc = ctx.createOscillator()
      this.thrustGain = ctx.createGain()

      this.thrustOsc.type = 'sawtooth'
      this.thrustOsc.frequency.value = 60

      this.thrustGain.gain.value = 0

      this.thrustOsc.connect(this.thrustGain)
      this.thrustNode = this.thrustGain

      // Lowpass filter for rumble effect
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 400

      this.thrustNode.connect(filter)
      filter.connect(ctx.destination)

      this.thrustOsc.start()
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Update thrust volume based on speed ratio (0-1)
  setThrustVolume(ratio: number) {
    if (this.thrustGain && this.ctx) {
      // Clamp ratio and add slight minimum for constant rumble
      const volume = Math.min(0.3, Math.max(0.05, ratio * 0.3))
      this.thrustGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1)
    }
  }

  // Stop thrust loop
  stopThrust() {
    if (this.thrustOsc) {
      try {
        this.thrustOsc.stop()
      } catch (e) {
        // Ignore if already stopped
      }
      this.thrustOsc.disconnect()
      this.thrustOsc = null
    }
    if (this.thrustGain) {
      this.thrustGain.disconnect()
      this.thrustGain = null
    }
    this.thrustNode = null
  }

  // Electric hum for shield activation
  playShieldOn() {
    try {
      const ctx = this.ensureContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15)

      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Clang for shield hit
  playShieldHit() {
    try {
      const ctx = this.ensureContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'square'
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2)

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Whoosh for hyperspace
  playHyperspace() {
    try {
      const ctx = this.ensureContext()
      const bufferSize = ctx.sampleRate * 0.8
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI)
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(200, ctx.currentTime)
      filter.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.4)
      filter.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.8)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.4)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      noise.start()
    } catch (e) {
      // Ignore audio errors
    }
  }

  // Arpeggio jingle for extra life
  playExtraLife() {
    try {
      const ctx = this.ensureContext()
      const now = ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50] // C major arpeggio
      const duration = 0.15

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.value = freq

        gain.gain.setValueAtTime(0.15, now + i * duration)
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * duration + duration)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * duration)
        osc.stop(now + i * duration + duration)
      })
    } catch (e) {
      // Ignore audio errors
    }
  }
}

// Main audio manager singleton
export class AudioManager {
  private sounds: Record<keyof typeof AUDIO_FILES, Howl | null> = {
    laser: null,
    explosion: null,
    shipExplode: null,
    thrust: null,
    shieldOn: null,
    shieldHit: null,
    hyperspace: null,
    extraLife: null,
  }
  private synthesizer: FallbackSynthesizer
  private initialized: boolean = false
  private muted: boolean = false

  constructor() {
    this.synthesizer = new FallbackSynthesizer()
    this.preloadSounds()
  }

  private preloadSounds() {
    for (const [key, path] of Object.entries(AUDIO_FILES)) {
      const soundKey = key as keyof typeof AUDIO_FILES
      try {
        this.sounds[soundKey] = new Howl({
          src: [`audio/${path}`],
          preload: true,
          volume: 1.0,
          // If the file is missing (no MP3 provided), drop it so we cleanly
          // fall back to the synthesized sound instead of playing silence.
          onloaderror: () => {
            this.sounds[soundKey] = null
          },
        })
      } catch (e) {
        this.sounds[soundKey] = null
      }
    }
  }

  // Initialize audio context on first user interaction (browser autoplay policy)
  init() {
    if (this.initialized) return
    this.synthesizer.resume()
    this.initialized = true
  }

  // Use the real audio file only when it actually finished loading; otherwise
  // play the synthesized fallback.
  private playSound(key: keyof typeof AUDIO_FILES, fallbackFn: () => void) {
    if (this.muted) return

    const sound = this.sounds[key]
    if (sound && sound.state() === 'loaded') {
      sound.play()
    } else {
      fallbackFn()
    }
  }

  // Play laser sound
  playLaser() {
    this.playSound('laser', () => this.synthesizer.playLaser())
  }

  // Play explosion sound
  playExplosion() {
    this.playSound('explosion', () => this.synthesizer.playExplosion())
  }

  // Play ship explosion sound
  playShipExplode() {
    this.playSound('shipExplode', () => this.synthesizer.playShipExplode())
  }

  // Start thrust loop
  startThrust() {
    if (this.muted) return
    this.synthesizer.startThrust()
  }

  // Update thrust volume
  setThrustVolume(ratio: number) {
    if (this.muted) return
    this.synthesizer.setThrustVolume(ratio)
  }

  // Stop thrust loop
  stopThrust() {
    this.synthesizer.stopThrust()
  }

  // Play shield activation sound
  playShieldOn() {
    this.playSound('shieldOn', () => this.synthesizer.playShieldOn())
  }

  // Play shield hit sound
  playShieldHit() {
    this.playSound('shieldHit', () => this.synthesizer.playShieldHit())
  }

  // Play hyperspace sound
  playHyperspace() {
    this.playSound('hyperspace', () => this.synthesizer.playHyperspace())
  }

  // Play extra life jingle
  playExtraLife() {
    this.playSound('extraLife', () => this.synthesizer.playExtraLife())
  }

  // Toggle mute
  toggleMute(): boolean {
    this.muted = !this.muted
    if (this.muted) {
      this.stopThrust()
    }
    return this.muted
  }

  // Check if muted
  isMuted(): boolean {
    return this.muted
  }
}

// Export singleton instance
export const audioManager = new AudioManager()
