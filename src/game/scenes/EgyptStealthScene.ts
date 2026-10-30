import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts' // 🌟 引入金币系统
import { paintPyramid } from '../world/paintPyramid.ts'
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
  private attempts = 0 // 🌟 新增：记录被抓次数
  
  private player!: Phaser.GameObjects.Container
  private mummies: MummyNode[] = []
  private darkness!: Phaser.GameObjects.Graphics
  private pressedKeys: Set<string> = new Set()

  constructor() {
    super('EgyptStealthScene')
  }

  create() {
    this.level = egyptStealthLevel
    this.overlayOpen = false
    this.completed = false
    this.attempts = 0
    this.mummies = []
    this.pressedKeys.clear()

    paintPyramid(this)
    this.drawDungeonFloor()
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

  private drawDungeonFloor() {
    const g = this.add.graphics().setDepth(10)
    g.fillStyle(0x3a2a1a, 0.9)
    g.fillRect(0, 0, 1280, 720)
    g.lineStyle(2, 0x2a1a10, 0.5)
    for(let x = 0; x <= 1280; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 720); g.strokePath() }
    for(let y = 0; y <= 720; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(1280, y); g.strokePath() }
  }

  private createPlayer() {
    this.player = this.add.container(this.level.startPos.x, this.level.startPos.y).setDepth(200)
    const g = this.add.graphics()
    g.fillStyle(0xe8dcc0, 1); g.fillCircle(0, 0, 12)
    g.fillStyle(0x2a4858, 1); g.fillCircle(0, -12, 8)
    this.player.add(g)
    this.player.setSize(24, 24)
    this.player.setData('startX', this.level.startPos.x)
    this.player.setData('startY', this.level.startPos.y)
  }

  private createMummy(cfg: MummyPatrolConfig) {
    const container = this.add.container(cfg.startX, cfg.startY).setDepth(200)
    const g = this.add.graphics()
    g.fillStyle(0xc8b090, 1)
    g.fillRect(-12, -10, 24, 20)
    g.fillRect(-8, -22, 16, 12)
    g.lineStyle(1, 0x8a7050, 0.5)
    for(let i=-10; i<=10; i+=5) { g.beginPath(); g.moveTo(-12, i); g.lineTo(12, i); g.strokePath() }
    container.add(g)

    const gfx = this.add.graphics().setDepth(80)
    gfx.setPosition(cfg.startX, cfg.startY)
    this.drawCone(gfx, cfg.viewAngle, cfg.viewRange)

    this.mummies.push({ config: cfg, container, gfx, dir: 1, targetX: cfg.endX, targetY: cfg.endY })
  }

  private drawCone(gfx: Phaser.GameObjects.Graphics, angleDeg: number, range: number) {
    gfx.clear()
    gfx.fillStyle(0xffffff, 1)
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
    g.fillStyle(0xd4a338, 0.4); g.fillCircle(0, 0, 40)
    g.fillStyle(0x3a2210, 1); g.fillRect(-25, -30, 50, 60)
    g.lineStyle(3, 0xd4a338, 1); g.strokeRect(-25, -30, 50, 60)
    exit.add(g)
    
    this.add.text(exit.x, exit.y - 45, '秘室', { fontFamily: UI_FONT, fontSize: '14px', color: '#d4a338' }).setOrigin(0.5).setDepth(100)
  }

  private setupDarkness() { this.darkness = this.add.graphics().setDepth(150) }

  update(_time: number, delta: number) {
    if (this.completed || this.overlayOpen) return
    this.updatePlayer(delta)
    this.updateMummies(delta)
    this.updateMask()
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
    })
  }

  private updateMask() {
    if (!this.darkness) return
    const g = this.darkness
    g.clear()
    g.fillStyle(0x000000, 0.85)
    g.fillRect(0, 0, 1280, 720)
    g.fillStyle(0xd4a338, 0.2)
    g.fillCircle(this.player.x, this.player.y, 100)

    this.mummies.forEach((m) => {
      const angleRad = Phaser.Math.DegToRad(m.config.viewAngle)
      g.fillStyle(0xd04848, 0.35)
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
    this.attempts++ // 🌟 记录被抓次数
    this.player.setAlpha(0)
    
    const flash = this.add.rectangle(640, 360, 1280, 720, 0xff0000, 0.5).setDepth(2000)
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
    this.add.text(1230, 38, '使用 W A S D 或 方向键移动', { fontFamily: UI_FONT, fontSize: '16px', color: '#efe6d8' }).setOrigin(1, 0).setDepth(3001).setAlpha(0.85)
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
    // 🌟 标记通关 + 发钱（没被抓到就是完美通关）
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