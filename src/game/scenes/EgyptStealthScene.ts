import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts' 
import { egyptStealthLevel } from '../data/levels/egypt-stealth.ts'
import type { StealthLevelConfig, MummyPatrolConfig } from '../types.ts'

type MummyNode = {
  config: MummyPatrolConfig
  container: Phaser.GameObjects.Container
  gfx: Phaser.GameObjects.Graphics
  dir: 1 | -1
  targetX: number
  targetY: number
}

export class EgyptStealthScene extends Phaser.Scene {
  private level!: StealthLevelConfig
  private overlayOpen = false
  private completed = false
  private attempts = 0
  
  private player!: Phaser.GameObjects.Container
  private mummies: MummyNode[] = []
  private darkness!: Phaser.GameObjects.Graphics
  private pressedKeys: Set<string> = new Set()

  constructor() {
    super('EgyptStealthScene')
  }

  preload() {
    // 🌟 加载你的地宫背景图
    this.load.image('egypt-bg', 'assets/egypt-corridor.jpg')
  }

  create() {
    this.level = egyptStealthLevel
    this.overlayOpen = false
    this.completed = false
    this.attempts = 0
    this.mummies = []
    this.pressedKeys.clear()

    // 🌟 绘制新背景
    if (this.textures.exists('egypt-bg')) {
      this.add.image(640, 360, 'egypt-bg').setDisplaySize(1280, 720).setDepth(-10)
    } else {
      this.add.rectangle(640, 360, 1280, 720, 0x1a1614, 1).setDepth(-10)
    }

    this.createPlayer()
    this.level.mummies.forEach((cfg) => this.createMummy(cfg))
    this.createExit()
    this.setupDarkness()
    this.buildHud()

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    
    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', this.handleKeyDown)
      window.removeEventListener('keyup', this.handleKeyUp)
    })
  }

  private handleKeyDown = (e: KeyboardEvent) => { this.pressedKeys.add(e.code) }
  private handleKeyUp = (e: KeyboardEvent) => { this.pressedKeys.delete(e.code) }

  private createPlayer() {
    this.player = this.add.container(this.level.startPos.x, this.level.startPos.y).setDepth(200)
    const g = this.add.graphics()
    // 玩家本体
    g.fillStyle(0xe8dcc0, 1); g.fillCircle(0, 0, 12)
    g.fillStyle(0x2a4858, 1); g.fillCircle(0, -12, 8)
    // 护身符发微光
    g.fillStyle(0xffd700, 0.5); g.fillCircle(0, 0, 18)
    
    this.player.add(g)
    this.player.setSize(24, 24)
    this.player.setData('startX', this.level.startPos.x)
    this.player.setData('startY', this.level.startPos.y)
  }

  private createMummy(cfg: MummyPatrolConfig) {
    const container = this.add.container(cfg.startX, cfg.startY).setDepth(200)
    
    // 🌟 重绘：极具真实感的木乃伊（带绷带、红眼）
    const g = this.add.graphics()
    // 身体底纹
    g.fillStyle(0x6b5a44, 1); g.fillRect(-12, -10, 24, 20)
    g.fillStyle(0x8c7a60, 1); g.fillRect(-10, -10, 8, 20) // 高光
    // 头部
    g.fillStyle(0x5c4a34, 1); g.fillCircle(0, -15, 8)
    // 绷带缠绕
    g.lineStyle(2, 0x3a2a18, 0.6)
    for(let i=-8; i<=8; i+=6) { g.beginPath(); g.moveTo(-12, i); g.lineTo(12, i+2); g.strokePath() }
    g.beginPath(); g.moveTo(-6, -15); g.lineTo(6, -12); g.strokePath()
    // 发光的红色眼睛
    g.fillStyle(0xff2200, 1); 
    g.fillCircle(-3, -15, 1.5); g.fillCircle(3, -15, 1.5)
    container.add(g)

    // 🌟 沙尘拖尾粒子
    if (!this.textures.exists('pixel')) {
      this.textures.generate('pixel', { data: ['0'], pixelWidth: 2, pixelHeight: 2 })
    }
    const particles = this.add.particles(0, 0, 'pixel', {
      color: [0xd4a338, 0x8c7a60],
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.6, end: 0 },
      speed: { min: 5, max: 20 },
      lifespan: 600,
      frequency: 80,
      blendMode: 'ADD'
    })
    particles.setDepth(190) // 在木乃伊脚下
    container.add(particles)

    // 视锥
    const gfx = this.add.graphics().setDepth(80)
    gfx.setPosition(cfg.startX, cfg.startY)
    this.drawCone(gfx, cfg.viewAngle, cfg.viewRange)

    this.mummies.push({ config: cfg, container, gfx, dir: 1, targetX: cfg.endX, targetY: cfg.endY })
  }

  private drawCone(gfx: Phaser.GameObjects.Graphics, angleDeg: number, range: number) {
    gfx.clear()
    // 🌟 换成血红色的半透明视野
    gfx.fillStyle(0xd04848, 0.35) 
    const angleRad = Phaser.Math.DegToRad(angleDeg)
    gfx.beginPath()
    gfx.moveTo(0, 0)
    gfx.arc(0, 0, range, -angleRad / 2, angleRad / 2)
    gfx.closePath()
    gfx.fillPath()
  }

  private createExit() {
    const exit = this.add.container(this.level.exitPos.x, this.level.exitPos.y).setDepth(1100)
    const g = this.add.graphics()
    g.fillStyle(0xffd700, 0.4); g.fillCircle(0, 0, 40)
    g.fillStyle(0x3a2210, 1); g.fillRect(-25, -30, 50, 60)
    g.lineStyle(3, 0xffd700, 1); g.strokeRect(-25, -30, 50, 60)
    exit.add(g)
    
    // 楼梯光影
    const glow = this.add.circle(this.level.exitPos.x, this.level.exitPos.y, 50, 0xffd700, 0.3).setDepth(1000)
    this.tweens.add({ targets: glow, scale: 1.5, alpha: 0.1, duration: 1200, yoyo: true, repeat: -1 })
    
    this.add.text(exit.x, exit.y - 45, '秘室', { fontFamily: UI_FONT, fontSize: '14px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5).setDepth(1200)
  }

  private setupDarkness() { this.darkness = this.add.graphics().setDepth(150) }

  update(_time: number, delta: number) {
    if (this.completed || this.overlayOpen) return
    this.updatePlayer(delta)
    this.updateMummies(delta)
    this.updateMask(_time)
    this.checkCollision()
  }

  private updatePlayer(delta: number) {
    const speed = 0.25 * delta
    let dx = 0, dy = 0
    if (this.pressedKeys.has('KeyA') || this.pressedKeys.has('ArrowLeft')) dx = -1
    else if (this.pressedKeys.has('KeyD') || this.pressedKeys.has('ArrowRight')) dx = 1
    if (this.pressedKeys.has('KeyW') || this.pressedKeys.has('ArrowUp')) dy = -1
    else if (this.pressedKeys.has('KeyS') || this.pressedKeys.has('ArrowDown')) dy = 1

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy)
      this.player.x += (dx / len) * speed
      this.player.y += (dy / len) * speed
    }
    this.player.x = Phaser.Math.Clamp(this.player.x, 20, 1260)
    this.player.y = Phaser.Math.Clamp(this.player.y, 20, 700)
  }

  private updateMummies(delta: number) {
    this.mummies.forEach((m) => {
      const cfg = m.config
      const step = (cfg.speed / 1000) * delta
      const distToEnd = Phaser.Math.Distance.Between(m.container.x, m.container.y, cfg.endX, cfg.endY)
      const distToStart = Phaser.Math.Distance.Between(m.container.x, m.container.y, cfg.startX, cfg.startY)

      if (m.dir === 1 && distToEnd < 5) m.dir = -1
      else if (m.dir === -1 && distToStart < 5) m.dir = 1

      const targetX = m.dir === 1 ? cfg.endX : cfg.startX
      const targetY = m.dir === 1 ? cfg.endY : cfg.startY

      if (Phaser.Math.Distance.Between(m.container.x, m.container.y, targetX, targetY) > 5) {
        const angle = Phaser.Math.Angle.Between(m.container.x, m.container.y, targetX, targetY)
        m.container.x += Math.cos(angle) * step
        m.container.y += Math.sin(angle) * step
      }

      m.gfx.x = m.container.x
      m.gfx.y = m.container.y
      m.gfx.rotation = Phaser.Math.Angle.Between(m.container.x, m.container.y, targetX, targetY)
      
      // 让木乃伊本体朝向前进方向
      m.container.rotation = m.gfx.rotation - Math.PI / 2 
    })
  }

  // 🌟 优化黑暗遮罩：带有呼吸感的血红色视锥
   private updateMask(time: number) {
    if (!this.darkness) return
    const g = this.darkness
    g.clear()
    
    // 🌟 把透明度从 0.88 改成了 0.4，这样背景图就能看见了
    g.fillStyle(0x050a10, 0.4) 
    g.fillRect(0, 0, 1280, 720)
    
    // 玩家自带手电筒光圈稍微亮一点
    g.fillStyle(0xffd700, 0.25)
    g.fillCircle(this.player.x, this.player.y, 120)

    // 木乃伊视锥（忽明忽暗闪烁）
    const pulseAlpha = 0.35 + Math.sin(time / 200) * 0.1
    
    this.mummies.forEach((m) => {
      const angleRad = Phaser.Math.DegToRad(m.config.viewAngle)
      g.fillStyle(0xd04848, pulseAlpha)
      g.beginPath()
      g.moveTo(m.container.x, m.container.y)
      g.arc(m.container.x, m.container.y, m.config.viewRange, m.gfx.rotation - angleRad / 2, m.gfx.rotation + angleRad / 2)
      g.closePath()
      g.fillPath()
    })
  }
  
  private checkCollision() {
    const distToExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.level.exitPos.x, this.level.exitPos.y)
    if (distToExit < 40) {
      this.completeLevel()
      return
    }

    for (const m of this.mummies) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, m.container.x, m.container.y)
      if (dist < m.config.viewRange) {
        const angleToPlayer = Phaser.Math.Angle.Between(m.container.x, m.container.y, this.player.x, this.player.y)
        const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToPlayer - m.gfx.rotation))
        if (angleDiff < Phaser.Math.DegToRad(m.config.viewAngle / 2)) {
          this.caughtByMummy()
          return
        }
      }
    }
  }

  private caughtByMummy() {
    this.completed = true
    this.attempts++ 
    this.player.setAlpha(0)
    
    // 屏幕震动 + 闪烁
    this.cameras.main.shake(300, 0.03)
    this.cameras.main.flash(300, 255, 0, 0, false)

    const flash = this.add.rectangle(640, 360, 1280, 720, 0xff0000, 0.6).setDepth(2000)
    this.tweens.add({
      targets: flash, alpha: 0, duration: 800,
      onComplete: () => {
        flash.destroy()
        this.showToast('你被发现了！回到起点')
        this.player.x = this.player.getData('startX')
        this.player.y = this.player.getData('startY')
        this.player.setAlpha(1)
        this.completed = false
      }
    })
  }

  private completeLevel() {
    if (this.completed) return
    this.completed = true
    this.showToast('成功抵达秘室！')
    this.time.delayedCall(1000, () => this.showKnowledgeCard())
  }

  private buildHud() {
    const hud = roundedPanel(this, 28, 24, 360, 92).setDepth(3000)
    hud.setScrollFactor(0)
    this.add.text(48, 38, `${this.level.chapter} · ${this.level.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(3001)
    this.add.text(48, 70, this.level.objective, { fontFamily: UI_FONT, fontSize: '16px', color: '#7d6354' }).setDepth(3001)
    this.add.text(1230, 38, '使用 W A S D 或 方向键移动', { fontFamily: UI_FONT, fontSize: '16px', color: '#efe6d8', backgroundColor: '#000000aa', padding: {x:10, y:10} }).setOrigin(1, 0).setDepth(3001).setAlpha(0.85)
    textButton(this, 1150, 100, '重 来', () => { this.scene.restart() }).setDepth(3001)
  }

  private showKnowledgeCard() {
    if (this.overlayOpen) return
    this.overlayOpen = true
    showKnowledgeCard(this, this.level.knowledgeCard, () => { this.showAzhuComment() })
  }

  private showAzhuComment() {
    const box = this.add.container(640, 600).setDepth(5000).setAlpha(0)
    const panel = roundedPanel(this, -420, -44, 840, 88, palette.panel)
    const icon = this.add.text(-380, -12, '🌸', { fontSize: '24px' })
    const label = this.add.text(-340, -32, '阿筑', { fontFamily: UI_FONT, fontSize: '14px', color: '#b09a6e' })
    const body = this.add.text(-340, -10, this.level.azhuComment, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', wordWrap: { width: 740 } })
    box.add([panel, icon, label, body])

    this.tweens.add({
      targets: box, alpha: 1, y: 588, duration: 320,
      onComplete: () => {
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: box, alpha: 0, y: 620, duration: 320,
            onComplete: () => { box.destroy(); this.showSuccess() },
          })
        })
      },
    })
  }

  private showSuccess() {
    LevelProgress.markCompleted(this.level.id)
    const isPerfect = this.attempts === 0
    const reward = CoinSystem.rewardLevel(this.level.id, isPerfect)
    CoinSystem.showFloatText(this, reward)

    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.38).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, this.level.successTitle, { fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, this.level.successBody, { fontFamily: UI_FONT, fontSize: '18px', color: '#6a635b', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5, 0).setDepth(5002)

    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'egypt-pyramid' })
    }).setDepth(5002)
  }

  private showToast(msg: string) {
    const t = this.add.text(640, 120, msg, { fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f', backgroundColor: '#efe6d8ee', padding: { x: 14, y: 8 } }).setOrigin(0.5).setDepth(4000).setAlpha(0)
    this.tweens.add({ targets: t, alpha: 1, y: 108, duration: 220, yoyo: true, hold: 1400, onComplete: () => t.destroy() })
  }
}