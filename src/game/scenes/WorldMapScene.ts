import Phaser from 'phaser'
import { worlds } from '../data/worlds.ts'
import { UI_FONT } from '../palette.ts'
import { textButton } from '../ui/panels.ts'
import type { WorldEntry, WorldId } from '../types.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { renderCoinHUD } from '../systems/CoinSystem.ts'

// 🌟 坐标已针对最新星空图微调，精准落在各大洲板块上
const WORLD_POS: Record<WorldId, { x: number; y: number }> = {
  'forbidden-city':  { x: 1004, y: 234 },
  'suzhou-garden':   { x: 995,  y: 301 }, 
  'yingxian-pagoda': { x: 952,  y: 205 }, 
  'egypt-pyramid':   { x: 720,  y: 365 }, 
  'petra':           { x: 775,  y: 295 }, 
  'dome-rock':       { x: 770,  y: 250 }, 
  'angkor':          { x: 965,  y: 340 }, 
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
    // 确认后缀是 .png
    this.load.image('world-map', '/assets/world-map bg.png')
  }

  create() {
    if (this.textures.exists('world-map')) {
      this.add.image(640, 360, 'world-map').setDisplaySize(1280, 720).setDepth(0)
    } else {
      this.add.rectangle(640, 360, 1280, 720, 0x0d1320, 1)
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
    const starGraphic = this.add.graphics()
    starGraphic.fillStyle(0xffffff, 1)
    starGraphic.fillCircle(3, 3, 3)
    starGraphic.generateTexture('star-particle', 6, 6)
    starGraphic.destroy()

    this.add.particles(0, 0, 'star-particle', {
      x: { min: 0, max: 1280 },
      y: { min: 0, max: 720 },
      lifespan: 4000,
      speedY: { min: -10, max: -30 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.2, end: 0.8, ease: 'Sine.easeInOut' },
      alpha: { start: 0, end: 0.8, ease: 'Sine.easeInOut' },
      quantity: 1,
      blendMode: 'ADD',
      frequency: 200,
    }).setDepth(1)

    const mist = this.add.rectangle(640, 360, 1280, 720, 0xffffff, 0.02).setDepth(3)
    this.tweens.add({
      targets: mist,
      alpha: 0.06,
      duration: 5000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private paintPath() {
    const g = this.add.graphics().setDepth(10)
    g.lineStyle(2.4, 0x88ccff, 0.5) 
    for (let i = 0; i < PATH_ORDER.length - 1; i++) {
      const from = WORLD_POS[PATH_ORDER[i]]
      const to = WORLD_POS[PATH_ORDER[i + 1]]
      this.curvedDashedLine(g, from.x, from.y, to.x, to.y)
    }
    for (const id of PATH_ORDER) {
      const p = WORLD_POS[id]
      g.fillStyle(0x88ccff, 0.8); g.fillCircle(p.x, p.y, 3)
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

  // 🌟 核心重写：红褐色字 + 耀眼金光
  private paintWorldSeal(world: WorldEntry, x: number, y: number) {
    const isPlayable = world.status === 'playable'
    const goldColor = 0xffd700 // 金黄色
    const textColor = isPlayable ? '#8b2500' : '#6a5a3c' // 朱砂红褐

    const container = this.add.container(x, y).setDepth(12)

    // 1. 2.5D 悬浮阴影
    const shadow = this.add.ellipse(0, 25, 40, 12, 0x000000, 0.3)
    container.add(shadow)

    // 2. 动态金色光晕（使用发光叠加模式，非常亮眼）
    if (isPlayable) {
      const glow = this.add.circle(0, 0, 22, goldColor, 0.16)
      glow.setBlendMode(Phaser.BlendModes.ADD)
      container.add(glow)
      this.tweens.add({ 
        targets: glow, 
        scale: 1.1, 
        alpha: 0.05, 
        duration: 1800, 
        yoyo: true, 
        repeat: -1, 
        ease: 'Sine.easeInOut' 
      })
    }

       // 3. 图章外圈（改成和文字一致的朱砂红褐）
    const ring = this.add.graphics()
    ring.lineStyle(2.5, 0x8b2500, isPlayable ? 1 : 0.6) // 👈 改了颜色
    ring.strokeCircle(0, 0, isPlayable ? 17 : 13)
    ring.lineStyle(1, 0x8b2500, isPlayable ? 0.8 : 0.35) // 👈 改了颜色
    ring.strokeCircle(0, 0, isPlayable ? 12 : 9)
    container.add(ring)

    // 4. 图章内的汉字
    const glyph = this.add.text(0, 0, WORLD_GLYPH[world.id], { 
      fontFamily: UI_FONT, 
      fontSize: isPlayable ? '14px' : '11px', 
      color: textColor,
      fontStyle: 'bold'
    }).setOrigin(0.5)
    container.add(glyph)

    // 5. 连接线（也改成红褐色，保持整体一致）
    const line = this.add.graphics()
    line.lineStyle(1.5, 0x8b2500, isPlayable ? 0.9 : 0.45) // 👈 改了颜色
    line.beginPath(); 
    line.moveTo(0, isPlayable ? 17 : 13)
    line.lineTo(0, isPlayable ? 22 : 18)
    line.strokePath()
    container.add(line)

    // 6. 世界名称文字（红褐）
    const label = this.add.text(0, isPlayable ? 26 : 20, world.name, { 
      fontFamily: UI_FONT, 
      fontSize: isPlayable ? '15px' : '12px', 
      color: textColor,
      fontStyle: isPlayable ? 'bold' : 'normal'
    }).setOrigin(0.5, 0)

    // 🌟 增加金色外发光，让红褐色字更醒目
    if (isPlayable) {
      label.setShadow(0, 0, '#ffd700', 6, true, true)
    }
    container.add(label)

    // 7. 状态文字（可入 / 已通关）
    if (isPlayable) {
      let done = false
      if (world.levels && world.levels.length > 0) {
        done = world.levels.every((lv) => LevelProgress.isCompleted(lv.id))
      }
      const statusText = done ? '✓ 已通关' : '可 入'
      const statusColor = done ? '#2e8b57' : '#8b2500'
      
      const statusTxt = this.add.text(0, isPlayable ? -24 : -20, statusText, { 
        fontFamily: UI_FONT, 
        fontSize: '12px', 
        color: statusColor,
        fontStyle: 'bold'
      }).setOrigin(0.5, 1)
      // 状态文字也加金色发光
      statusTxt.setShadow(0, 0, '#ffd700',4, true, true)
      container.add(statusTxt)
    } else {
      const mist = this.add.circle(0, 0, 22, 0x8a6f3e, 0.16)
      this.tweens.add({ targets: mist, alpha: 0.05, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      container.add(mist)
      
      const statusTxt = this.add.text(0, -18, '待 寻', { fontFamily: UI_FONT, fontSize: '11px', color: '#8a7a5c' }).setOrigin(0.5, 1)
      container.add(statusTxt)
    }

    // 8. 2.5D 悬浮动画 + 文字跳动
    if (isPlayable) {
      this.tweens.add({
        targets: container,
        y: y - 8, 
        duration: 2000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      this.tweens.add({
        targets: shadow,
        scaleX: 0.8,
        scaleY: 0.8,
        alpha: 0.1,
        duration: 2000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })

      this.tweens.add({
        targets: [label, glyph],
        scale: 1.05,
        alpha: 0.85,
        duration: 800 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }

    // 9. 交互热区
    if (isPlayable) {
      const hit = this.add.circle(0, 0, 28, 0x000000, 0.001).setInteractive({ useHandCursor: true })
      hit.on('pointerover', () => label.setColor('#ff4500')) // 悬停时变成亮橙红色
      hit.on('pointerout', () => label.setColor(textColor))
      hit.on('pointerup', () => this.scene.start('WorldDetailScene', { worldId: world.id }))
      container.add(hit)
    } else {
      const hit = this.add.circle(0, 0, 20, 0x000000, 0.001).setInteractive({ useHandCursor: true })
      hit.on('pointerup', () => this.showToast(`${world.name} · 尚未开启`))
      container.add(hit)
    }
  }

  private paintShipAndAnimate() {
    const ship = this.add.container(0, 0).setDepth(15)
    const g = this.add.graphics()
    g.fillStyle(0xffd700, 1); g.fillTriangle(-8, 0, 8, 0, 0, 6)
    g.lineStyle(1, 0xffffff, 0.8); g.strokeTriangle(-8, 0, 8, 0, 0, 6)
    ship.add(g)

    this.tweens.add({
      targets: ship,
      x: { from: WORLD_POS['machu-picchu'].x, to: WORLD_POS['forbidden-city'].x },
      y: { from: WORLD_POS['machu-picchu'].y, to: WORLD_POS['forbidden-city'].y },
      duration: 12000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      onUpdate: () => { ship.setRotation(Math.sin(ship.x * 0.05) * 0.1) },
    })
  }

  private paintHeader() {
    const titleX = 640
    const titleY = 45
    const boxW = 420
    const boxH = 50
    const boxX = titleX - boxW / 2
    const boxY = titleY - boxH / 2

    const g = this.add.graphics().setDepth(15)
    g.lineStyle(3, 0xa83232, 0.85)
    g.strokeRoundedRect(boxX, boxY, boxW, boxH, 8)
    g.lineStyle(1, 0xd4a338, 0.4)
    g.strokeRoundedRect(boxX + 4, boxY + 4, boxW - 8, boxH - 8, 4)

    this.add.text(titleX, titleY, '八 方 寻 脉 · 世 界 图', { 
      fontFamily: UI_FONT, 
      fontSize: '22px', 
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(16).setShadow(1, 2, '#000000', 3)

    textButton(this, 130, 42, '← 标题', () => { this.scene.start('TitleScene') }).setDepth(16)
  }

  private paintFooter() {
    this.add.text(640, 680, '八枚文明印记 · 汇合于《营造之书》', { fontFamily: UI_FONT, fontSize: '13px', color: '#ffffff' }).setOrigin(0.5).setAlpha(0.5).setDepth(15)
  }

  private showToast(msg: string) {
    const toast = this.add.text(640, 600, msg, {
        fontFamily: UI_FONT, fontSize: '16px', color: '#ffffff',
        backgroundColor: '#000000aa', padding: { x: 16, y: 8 },
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