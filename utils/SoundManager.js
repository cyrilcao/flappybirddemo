export class SoundManager {
  constructor() {
    this.sounds = {}
    this.isMuted = false
    this.isAvailable = true
    this.loadSounds()
  }

  loadSounds() {
    const soundFiles = {
      flap: '/assets/sounds/flap.mp3',
      score: '/assets/sounds/score.mp3',
      hit: '/assets/sounds/hit.mp3',
      die: '/assets/sounds/die.mp3'
    }

    try {
      for (const [name, path] of Object.entries(soundFiles)) {
        const sound = wx.createInnerAudioContext()
        sound.src = path
        sound.volume = 0.5
        
        sound.onError((err) => {
          console.warn(`Sound ${name} failed to load:`, err)
          this.isAvailable = false
          sound.destroy()
          delete this.sounds[name]
        })
        
        this.sounds[name] = sound
      }
    } catch (error) {
      console.warn('Sound system initialization failed:', error)
      this.isAvailable = false
    }
  }

  play(soundName) {
    if (!this.isAvailable || this.isMuted || !this.sounds[soundName]) return

    try {
      const sound = this.sounds[soundName]
      sound.stop()
      sound.seek(0)
      sound.play()
    } catch (error) {
      console.warn(`Failed to play sound: ${soundName}`, error)
      this.isAvailable = false
    }
  }

  toggleMute() {
    if (!this.isAvailable) return false
    this.isMuted = !this.isMuted
    return this.isMuted
  }

  dispose() {
    if (!this.isAvailable) return

    try {
      for (const sound of Object.values(this.sounds)) {
        sound.destroy()
      }
    } catch (error) {
      console.warn('Failed to dispose sound system:', error)
    } finally {
      this.sounds = {}
      this.isAvailable = false
    }
  }
} 