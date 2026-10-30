import Phaser from 'phaser'
import { worlds } from '../data/worlds.ts'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import type { WorldEntry, WorldId, LevelEntry } from '../types.ts'

const CARD_W = 700
const CARD_H = 110
const GAP = 20

export class WorldDetailScene extends Phaser.Scene {
  private world!: WorldEntry

  constructor() {
    super('WorldDetailScene')
  }

  init(data: { worldId: WorldId }) {
    const w = worlds.find((x) => x.id === data.worldId)
    if (!w) throw new Error(`World not found: ${data.worldId}`)
    this.world = w
  }

  create() {
    this.paintBackground()
    this.paintHeader()
    this.paintLevelList()
    this.paintFooter()
  }

  private paintBackground() {
    const g = this.add.graphics()
    g.fillGradientStyle(palette.sky, palette.sky, palette.skyDeep, palette.mist, 1)
    g.fillRect(0, 0, 1280, 720)
    g.fillStyle(palette.sage, 0.2)
    g.fillEllipse(240, 620, 400, 100)
    g.fillStyle(palette.moss, 0.18)
    g.fillEllipse(1040, 160, 380, 90)
  }

  private paintHeader() {
    this.add.text(640, 60, this.world.name, { fontFamily: UI_FONT, fontSize: '40px', color: '#4a453f' }).setOrigin(0.5)
    this.add.text(640, 108, '寻脉 · 世界内部', { fontFamily: UI_FONT, fontSize: '15px', color: '#7d6354' }).setOrigin(0.5)
    textButton(this, 130, 60, '← 世界地图', () => { this.scene.start('WorldMapScene') })
  }

  private paintLevelList() {
    const levels = this.world.levels ?? []
    const totalH = levels.length * CARD_H + (levels.length - 1) * GAP
    const startY = 360 - totalH / 2 + CARD_H / 2

    levels.forEach((lv, i) => {
      const x = 640
      const y = startY + i * (CARD_H + GAP)
      this.paintLevelCard(lv, x, y, i)
    })
  }

  private paintLevelCard(lv: LevelEntry, cx: number, cy: number, index: number) {
    const done = LevelProgress.isCompleted(lv.id)
    let unlocked = true
    if (index > 0) {
      const prev = this.world.levels!.slice(0, index)
      unlocked = prev.every((p) => LevelProgress.isCompleted(p.id))
    }

    const fillColor = !unlocked ? palette.mist : palette.panel
    const alpha = !unlocked ? 0.55 : 0.96
    const textColor = !unlocked ? '#9a8d7a' : '#4a453f'

    const container = this.add.container(cx, cy)
    const panel = roundedPanel(this, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, fillColor as number)
    panel.setAlpha(alpha)
    container.add(panel)

    container.add(this.add.text(-CARD_W / 2 + 40, 0, `第 ${index + 1} 关`, { fontFamily: UI_FONT, fontSize: '14px', color: textColor }).setOrigin(0.5))
    container.add(this.add.text(-CARD_W / 2 + 110, -16, lv.title, { fontFamily: UI_FONT, fontSize: '22px', color: textColor }).setOrigin(0, 0.5))
    container.add(this.add.text(-CARD_W / 2 + 110, 16, lv.subtitle, { fontFamily: UI_FONT, fontSize: '14px', color: unlocked ? '#7d6354' : '#9a8d7a' }).setOrigin(0, 0.5))

    let statusText = ''
    let statusColor = '#b8894a'
    if (done) { statusText = '✓ 已通关'; statusColor = '#5a8a4a' }
    else if (!unlocked) { statusText = '🔒 未解锁'; statusColor = '#9a8d7a' }
    else { statusText = '可 入'; statusColor = '#b8894a' }
    container.add(this.add.text(CARD_W / 2 - 40, 0, statusText, { fontFamily: UI_FONT, fontSize: '14px', color: statusColor }).setOrigin(1, 0.5))

    // 🌟 透明矩形覆盖法（绝对能点）
    const hitArea = this.add.rectangle(cx, cy, CARD_W, CARD_H, 0x000000, 0)
      .setDepth(100)
      .setInteractive({ useHandCursor: unlocked })

    hitArea.on('pointerover', () => { if (unlocked) panel.setAlpha(1) })
    hitArea.on('pointerout', () => { panel.setAlpha(alpha) })
    
    hitArea.on('pointerup', () => {
      if (unlocked) {
        // 🌟 只有进入每个世界的【第一关】时，才播放剧情
        if (index === 0) {
          this.scene.start('StoryIntroScene', { 
            worldId: this.world.id, 
            nextScene: lv.sceneKey 
          })
        } else {
          this.scene.start(lv.sceneKey)
        }
      } else {
        this.showToast('需先通关前面的关卡')
      }
    })
  }

  private paintFooter() {
    const levels = this.world.levels ?? []
    const done = LevelProgress.countCompleted(levels.map((l) => l.id))
    this.add.text(640, 680, `进度：${done} / ${levels.length}`, { fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354' }).setOrigin(0.5).setAlpha(0.75)
    textButton(this, 1150, 660, '图 鉴', () => { this.scene.start('CodexScene', { worldId: this.world.id }) })
  }

  private showToast(msg: string) {
    const t = this.add.text(640, 620, msg, { fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f', backgroundColor: '#efe6d8ee', padding: { x: 16, y: 8 } }).setOrigin(0.5).setDepth(9999).setAlpha(0)
    this.tweens.add({ targets: t, alpha: 1, duration: 200, yoyo: true, hold: 1200, onComplete: () => t.destroy() })
  }
}