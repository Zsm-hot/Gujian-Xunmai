import Phaser from 'phaser'

export class AudioSystem {
  private static ctx: AudioContext | null = null
  private static bgm: Phaser.Sound.BaseSound | null = null
  private static isMuted = false

  private static getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  // 播放合成音效（无需外部文件）
  static playSFX(type: 'click' | 'error' | 'success' | 'coin') {
    if (this.isMuted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'click') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.start(); osc.stop(ctx.currentTime + 0.1)
    } 
    else if (type === 'error') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start(); osc.stop(ctx.currentTime + 0.2)
    } 
    else if (type === 'coin') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(); osc.stop(ctx.currentTime + 0.3)
    } 
    else if (type === 'success') {
      // 播放一个大和弦
      const notes = [523.25, 659.25, 783.99, 1046.50] // C大调和弦
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sine'
        o.frequency.value = freq
        g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1)
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.5)
        o.start(ctx.currentTime + i * 0.1)
        o.stop(ctx.currentTime + i * 0.1 + 0.5)
      })
    }
  }

  // 挂载全局 BGM
  static playBGM(scene: Phaser.Scene, key: string) {
    if (this.bgm) this.bgm.stop()
    if (scene.cache.audio.exists(key)) {
      this.bgm = scene.sound.add(key, { loop: true, volume: 0.3 })
      this.bgm.play()
    }
  }
}