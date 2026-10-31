import Phaser from 'phaser'
import { worlds } from '../data/worlds.ts'
import { UI_FONT } from '../palette.ts'
import { textButton } from '../ui/panels.ts'
import type { WorldEntry, WorldId } from '../types.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { renderCoinHUD } from '../systems/CoinSystem.ts'
// 🌟 坐标已优化：全部移入米黄色陆地板块，避开深海区
const WORLD_POS: Record<WorldId, { x: number; y: number }> = {
  'forbidden-city':  { x: 1004, y: 234 },
  'suzhou-garden':   { x: 1015,  y: 299 }, // 👈 往左移动了一点，不再悬空
  'yingxian-pagoda': { x: 952,  y: 205 }, 
  'egypt-pyramid':   { x: 720,  y: 365 }, // 👈 往下移动了一点，不挡佩特拉文字
  'petra':           { x: 775,  y: 310 }, 
  'dome-rock':       { x: 770,  y: 250 }, 
  'angkor':          { x: 980,  y: 350 }, 
  'machu-picchu':    { x: 420,  y: 505 }, 
}

const PATH_ORDER: WorldId[] = [
  'machu-picchu', 'egypt-pyramid', 'petra', 'dome-rock', 
  'angkor', 'yingxian-pagoda', 'forbidden-city', 'suzhou-garden'
]

const WORLD_GLYPH: Record<WorldId, string> = {
  'forbidden-city':  '宫', 'suzhou-garden':   '园', 'yingxian-pagoda': '塔', 
  'angkor':          '窟', 'petra':           '岩', 'dome-rock':       '穹', 
  'egypt-pyramid':   '金', 'machu-picchu':    '峰',
}

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super('WorldMapScene')
  }

  preload() {
    this.load.image('world-map', '/assets/world-map-bg.jpg')
  }

  create() {
    if (this.textures.exists('world-map')) {
      this.add.image(640, 360, 'world-map').setDisplaySize(1280, 720).setDepth(0)
    } else {
      this.add.rectangle(640, 360, 1280, 720, 0xf4ecd6, 1)
    }

    this.drawNauticalVibe()
    this.paintPath()
    this.paintWorlds()
    this.paintShipAndAnimate()
    this.paintHeader()
    this.paintFooter()

    renderCoinHUD(this, 2000)

    textButton(this, 880, 680, '云笺坊集', () => {
      this.scene.start('MarketScene')
    }).setDepth(50)
    textButton(this, 1150, 680, '八 方 图 鉴', () => {
      this.scene.start('CodexScene')
    }).setDepth(50)
  }

  private drawNauticalVibe() {
    const vignette = this.add.graphics().setDepth(1)
    vignette.fillGradientStyle(0x2d1c10, 0x2d1c10, 0x000000, 0x000000, 0.4, 0.4, 0, 0)
    vignette.fillRect(0, 0, 1280, 80)
    vignette.fillGradientStyle(0x000000, 0x000000, 0x2d1c10, 0x2d1c10, 0, 0, 0.4, 0.4)
    vignette.fillRect(0, 640, 1280, 80)
    vignette.fillGradientStyle(0x2d1c10, 0x000000, 0x2d1c10, 0x000000, 0.4, 0, 0.4, 0)
    vignette.fillRect(0, 0, 80, 720)
    vignette.fillGradientStyle(0x000000, 0x2d1c10, 0x000000, 0x2d1c10, 0, 0.4, 0, 0.4)
    vignette.fillRect(1200, 0, 80, 720)

    const roseBg = this.add.graphics().setDepth(1)
    roseBg.lineStyle(1.5, 0x8a6f3e, 0.08)
    const rcx = 920, rcy = 480, rR = 220
    roseBg.strokeCircle(rcx, rcy, rR)
    roseBg.strokeCircle(rcx, rcy, rR * 0.7)
    roseBg.strokeCircle(rcx, rcy, rR * 0.4)
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8
      roseBg.beginPath()
      roseBg.moveTo(rcx, rcy)
      roseBg.lineTo(rcx + Math.cos(angle) * rR, rcy + Math.sin(angle) * rR)
      roseBg.strokePath()
    }

    const grid = this.add.graphics().setDepth(1)
    grid.lineStyle(1, 0x8a6f3e, 0.06)
    for (let x = 120; x < 1200; x += 120) {
      grid.beginPath(); grid.moveTo(x, 0); grid.lineTo(x, 720); grid.strokePath()
    }
    for (let y = 120; y < 720; y += 120) {
      grid.beginPath(); grid.moveTo(0, y); grid.lineTo(1280, y); grid.strokePath()
    }

    const burnt = this.add.graphics().setDepth(2)
    burnt.fillStyle(0x2d1c10, 0.2)
    for (let i = 0; i < 15; i++) burnt.fillEllipse(Phaser.Math.Between(0, 1280), 0, Phaser.Math.Between(80, 160), Phaser.Math.Between(20, 40))
    for (let i = 0; i < 15; i++) burnt.fillEllipse(Phaser.Math.Between(0, 1280), 720, Phaser.Math.Between(80, 160), Phaser.Math.Between(20, 40))
    for (let i = 0; i < 10; i++) burnt.fillEllipse(0, Phaser.Math.Between(0, 720), Phaser.Math.Between(20, 40), Phaser.Math.Between(80, 160))
    for (let i = 0; i < 10; i++) burnt.fillEllipse(1280, Phaser.Math.Between(0, 720), Phaser.Math.Between(20, 40), Phaser.Math.Between(80, 160))

    const mist = this.add.rectangle(640, 360, 1280, 720, 0xffffff, 0.03).setDepth(3)
    this.tweens.add({
      targets: mist,
      alpha: 0.08,
      duration: 5000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private paintPath() {
    const g = this.add.graphics().setDepth(10)
    g.lineStyle(2.4, 0xb8894a, 0.72)
    for (let i = 0; i < PATH_ORDER.length - 1; i++) {
      const from = WORLD_POS[PATH_ORDER[i]]
      const to = WORLD_POS[PATH_ORDER[i + 1]]
      this.curvedDashedLine(g, from.x, from.y, to.x, to.y)
    }
    for (const id of PATH_ORDER) {
      const p = WORLD_POS[id]
      g.fillStyle(0xb8894a, 0.7); g.fillCircle(p.x, p.y, 3)
    }
  }

  private curvedDashedLine(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 40
    const segments = 48; let dashOn = true, dashCount = 0; const dashLen = 3
    for (let i = 0; i < segments; i++) {
      const p1 = this.bezier(x1, y1, mx, my, x2, y2, i / segments)
      const p2 = this.bezier(x1, y1, mx, my, x2, y2, (i + 1) / segments)
      if (dashOn) { g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.strokePath() }
      dashCount += 1; if (dashCount >= dashLen) { dashCount = 0; dashOn = !dashOn }
    }
  }

  private bezier(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, t: number) {
    const mt = 1 - t
    return { x: mt * mt * x1 + 2 * mt * t * cx + t * t * x2, y: mt * mt * y1 + 2 * mt * t * cy + t * t * y2 }
  }

  private paintWorlds() {
    for (const world of worlds) {
      const pos = WORLD_POS[world.id]
      if (pos) this.paintWorldSeal(world, pos.x, pos.y)
    }
  }

  private paintWorldSeal(world: WorldEntry, x: number, y: number) {
    const isPlayable = world.status === 'playable'
    const stampColor = isPlayable ? 0xa83232 : 0x8a7a5c
    const labelColor = isPlayable ? '#7a1f1f' : '#5a4a34'

    if (isPlayable) {
      const glow = this.add.circle(x, y, 26, 0xd4a338, 0.22).setDepth(11)
      this.tweens.add({ targets: glow, scale: 1.5, alpha: 0.05, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    }

    const ring = this.add.graphics().setDepth(12)
    ring.lineStyle(2, stampColor, isPlayable ? 0.9 : 0.6); ring.strokeCircle(x, y, isPlayable ? 17 : 13)
    ring.lineStyle(1, stampColor, isPlayable ? 0.6 : 0.35); ring.strokeCircle(x, y, isPlayable ? 12 : 9)

    this.add.text(x, y, WORLD_GLYPH[world.id], { fontFamily: UI_FONT, fontSize: isPlayable ? '14px' : '11px', color: isPlayable ? '#7a1f1f' : '#6a5a3c' }).setOrigin(0.5).setDepth(12)

    const line = this.add.graphics().setDepth(12)
    line.lineStyle(1, stampColor, isPlayable ? 0.7 : 0.45)
    line.beginPath(); line.moveTo(x, y + (isPlayable ? 17 : 13)); line.lineTo(x, y + (isPlayable ? 22 : 18)); line.strokePath()

    const label = this.add.text(x, y + (isPlayable ? 26 : 20), world.name, { fontFamily: UI_FONT, fontSize: isPlayable ? '14px' : '12px', color: labelColor }).setOrigin(0.5, 0).setDepth(12)

    if (isPlayable) {
      let done = false
      if (world.levels && world.levels.length > 0) {
        const allDone = world.levels.every((lv) => LevelProgress.isCompleted(lv.id))
        if (allDone) done = true
      }
      this.add.text(x, y - (isPlayable ? 24 : 20), done ? '✓ 已通关' : '可 入', { fontFamily: UI_FONT, fontSize: '11px', color: done ? '#5a8a4a' : '#b8894a' }).setOrigin(0.5, 1).setDepth(12)
    } else {
      const mist = this.add.circle(x, y, 22, 0x8a6f3e, 0.16).setDepth(12)
      this.tweens.add({ targets: mist, alpha: 0.05, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      this.add.text(x, y - 18, '待 寻', { fontFamily: UI_FONT, fontSize: '11px', color: '#8a7a5c' }).setOrigin(0.5, 1).setDepth(12)
    }

    if (isPlayable) {
      const hit = this.add.circle(x, y, 24, 0x000000, 0.001).setInteractive({ useHandCursor: true }).setDepth(20)
      hit.on('pointerover', () => label.setColor('#c4884a'))
      hit.on('pointerout', () => label.setColor(labelColor))
      hit.on('pointerup', () => this.scene.start('WorldDetailScene', { worldId: world.id }))
    } else {
      const hit = this.add.circle(x, y, 20, 0x000000, 0.001).setInteractive({ useHandCursor: true }).setDepth(20)
      hit.on('pointerup', () => this.showToast(`${world.name} · 尚未开启`))
    }
  }

  private paintShipAndAnimate() {
    const ship = this.add.container(0, 0).setDepth(15)
    const g = this.add.graphics()
    g.fillStyle(0x6a4a24, 1); g.fillTriangle(-10, 0, 10, 0, 0, 8)
    g.lineStyle(1, 0x3a2a14, 0.9); g.strokeTriangle(-10, 0, 10, 0, 0, 8)
    g.lineStyle(1.2, 0x3a2a14, 0.9); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -14); g.strokePath()
    g.fillStyle(0xf3e8cf, 0.9); g.fillTriangle(0, -14, 0, -4, 8, -9)
    ship.add(g)

    this.tweens.add({
      targets: ship,
      x: { from: WORLD_POS['machu-picchu'].x, to: WORLD_POS['forbidden-city'].x },
      y: { from: WORLD_POS['machu-picchu'].y, to: WORLD_POS['forbidden-city'].y },
      duration: 10000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      onUpdate: () => { ship.setRotation(Math.sin(ship.x * 0.05) * 0.08) },
    })
  }

  // 🌟 顶部标题 + 红色印章风格边框 + 白色文字
  private paintHeader() {
    const titleX = 640
    const titleY = 45
    const boxW = 420
    const boxH = 50
    const boxX = titleX - boxW / 2
    const boxY = titleY - boxH / 2

    const g = this.add.graphics().setDepth(15)
    // 外圈粗红框（类似印泥边框）
    g.lineStyle(3, 0xa83232, 0.85)
    g.strokeRoundedRect(boxX, boxY, boxW, boxH, 8)
    // 内圈细金线
    g.lineStyle(1, 0xd4a338, 0.4)
    g.strokeRoundedRect(boxX + 4, boxY + 4, boxW - 8, boxH - 8, 4)

    this.add.text(titleX, titleY, '八 方 寻 脉 · 世 界 图', { 
      fontFamily: UI_FONT, 
      fontSize: '22px', 
      color: '#ffffff',       // 👈 改成了白色
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(16).setShadow(1, 2, '#000000', 3) // 👈 加重了黑色阴影，保证白字清晰

    textButton(this, 130, 42, '← 标题', () => { this.scene.start('TitleScene') }).setDepth(16)
  }

  private paintFooter() {
    this.add.text(640, 680, '八枚文明印记 · 汇合于《营造之书》', { fontFamily: UI_FONT, fontSize: '13px', color: '#7a5a34' }).setOrigin(0.5).setAlpha(0.75).setDepth(15)
  }

  private showToast(msg: string) {
    const toast = this.add.text(640, 600, msg, {
        fontFamily: UI_FONT, fontSize: '16px', color: '#4a3a24',
        backgroundColor: '#f3e8cfee', padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setDepth(9999).setAlpha(0)
    this.tweens.add({ 
      targets: toast, 
      alpha: 1, 
      duration: 200, 
      yoyo: true, 
      hold: 1200, 
      onComplete: () => toast.destroy() 
    })
  }
}

