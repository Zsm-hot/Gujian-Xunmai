import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts' // 🌟 引入金币系统
import { paintPyramid } from '../world/paintPyramid.ts'
import { DragPuzzleInteraction } from '../ui/DragPuzzleInteraction.ts'
import {
  egyptMuralPieces,
  egyptMuralSlots,
  egyptMuralHomePositions,
} from '../data/levels/egypt-mural.ts'

const LEVEL = {
  id: 'egypt-mural',
  chapter: '寻脉其四 · 其一',
  title: '残破壁画',
  objective: '将象形符号补全进残缺的壁画',
  knowledgeCard: {
    title: '古埃及象形文字',
    content:
      '古埃及壁画上的符号不只是"装饰"——它们是一套"可读的文字系统"。\n' +
      '"荷鲁斯之眼"象征保护与治愈；"安卡"象征生命；"圣甲虫"象征重生。\n' +
      '这些符号与法老的权力、宗教仪式、星辰崇拜紧密相关。',
    source: '参考资料：《埃及亡灵书》（史实复核中）',
  },
  azhuComment: '符号不止是画——它们是"古人的语言"。',
  successTitle: '壁画重现',
  successBody: '四个象形符号重新补全。古埃及的智慧，又一次被读懂。',
}

export class EgyptMuralScene extends Phaser.Scene {
  private overlayOpen = false
  private attempts = 0

  constructor() {
    super('EgyptMuralScene')
  }

  create() {
    this.overlayOpen = false
    this.attempts = 0

    // 沙漠背景
    paintPyramid(this)

    // 绘制"大壁画"
    this.paintMuralScroll()

    // 拼图组件
    new DragPuzzleInteraction({
      scene: this,
      pieces: egyptMuralPieces,
      slots: egyptMuralSlots,
      pieceHomePositions: egyptMuralHomePositions,
      onAllCorrect: () => {
        this.time.delayedCall(500, () => this.showKnowledgeCard())
      },
      onWrong: () => {
        this.attempts += 1
      },
    })

    // ★ 底部卡片下方的拆解说明
    const descs = [
      { name: '荷鲁斯之眼', meaning: '神明的注视', concept: '「庇护」' },
      { name: '安卡', meaning: '生命之符', concept: '「生命」' },
      { name: '圣甲虫', meaning: '推粪球的甲虫', concept: '「重生」' },
      { name: '太阳神', meaning: '太阳圆盘', concept: '「神权」' },
    ]

    const totalW = 4 * 78 + 3 * 6
    const startX = 640 - totalW / 2 + 39

    descs.forEach((desc, i) => {
      const cx = startX + i * 84

      this.add.text(cx, 605, desc.name, {
        fontFamily: UI_FONT, fontSize: '13px', color: '#4a3020', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(3000)

      this.add.text(cx, 623, desc.meaning, {
        fontFamily: UI_FONT, fontSize: '11px', color: '#7a6a5a',
      }).setOrigin(0.5).setDepth(3000)
    })

    this.buildHud()
  }

  private paintMuralScroll() {
    const g = this.add.graphics().setDepth(100)
    const W = 960
    const H = 420
    const startX = (1280 - W) / 2
    const startY = 150
    
    g.fillStyle(0xebdcb5, 1)
    g.fillRoundedRect(startX, startY, W, H, 4)
    
    g.fillStyle(0x8a7050, 0.1)
    for(let i=0; i<40; i++) {
      g.fillCircle(startX + Phaser.Math.Between(20, W-20), startY + Phaser.Math.Between(20, H-20), Phaser.Math.Between(2, 8))
    }

    const borderH = 26
    g.fillStyle(0x3a2210, 1); g.fillRect(startX, startY, W, borderH)
    g.fillStyle(0x3a2210, 1); g.fillRect(startX, startY+H-borderH, W, borderH)
    
    for(let x=startX+10; x<startX+W-20; x+=30) {
      g.fillStyle(x % 60 === 0 ? 0xd4a338 : 0x8a3a2a, 0.8)
      g.fillRect(x, startY+6, 15, 14)
      g.fillRect(x, startY+H-borderH+6, 15, 14)
    }
    
    const contentY = startY + borderH + 20
    const contentH = H - borderH * 2 - 40
    
    const px = startX + 90
    const py = contentY + contentH * 0.6
    g.lineStyle(5, 0x8a3a2a, 0.9)
    g.beginPath(); g.moveTo(px + 10, py - 90); g.lineTo(px + 10, py - 30); g.lineTo(px + 40, py - 30); g.lineTo(px + 40, py + 80); g.strokePath()
    g.beginPath(); g.moveTo(px + 10, py - 70); g.lineTo(px - 15, py - 70); g.lineTo(px - 15, py - 40); g.strokePath()
    g.fillStyle(0x3a2210, 1); g.fillCircle(px, py - 60, 3)
    g.lineStyle(3, 0x3a2210, 0.8); g.beginPath(); g.moveTo(px - 25, py - 100); g.lineTo(px - 25, py + 80); g.strokePath()

    const gx = startX + W - 80
    const gy = contentY + contentH * 0.4
    g.lineStyle(5, 0x3a2210, 0.9)
    g.beginPath(); g.moveTo(gx - 10, gy - 90); g.lineTo(gx - 10, gy - 30); g.lineTo(gx - 40, gy - 30); g.lineTo(gx - 40, gy + 80); g.strokePath()
    g.beginPath(); g.moveTo(gx - 10, gy - 70); g.lineTo(gx + 15, gy - 70); g.lineTo(gx + 15, gy - 40); g.strokePath()
    g.fillStyle(0x3a2210, 1); g.fillCircle(gx, gy - 60, 3)

    g.lineStyle(1, 0x3a2210, 0.1)
    for(let i=0; i<22; i++) { g.beginPath(); g.moveTo(startX + 160 + i * 28, contentY); g.lineTo(startX + 160 + i * 28, contentY + contentH); g.strokePath() }
    for(let i=0; i<14; i++) { g.beginPath(); g.moveTo(startX + 160, contentY + i * 28); g.lineTo(startX + W - 160, contentY + i * 28); g.strokePath() }
    
    for(let i=0; i<50; i++) {
      const rx = startX + Phaser.Math.Between(170, W - 170)
      const ry = contentY + Phaser.Math.Between(10, contentH - 10)
      
      if(i % 5 === 0) { g.fillStyle(0xb83828, 0.6); g.fillCircle(rx, ry, 8) } 
      else if (i % 5 === 1) { g.fillStyle(0xd4a338, 0.5); g.fillCircle(rx, ry, 6); g.fillStyle(0xebdcb5, 1); g.fillCircle(rx + 2, ry - 2, 5) } 
      else if (i % 5 === 2) { g.lineStyle(1.5, 0x2a5a2a, 0.4); g.beginPath(); g.moveTo(rx, ry+5); g.lineTo(rx, ry-5); g.strokePath(); g.fillStyle(0xb83828, 0.5); g.fillCircle(rx, ry-6, 3) } 
      else { g.fillStyle(0x3a2210, 0.2); if (i % 2 === 0) { g.fillRect(rx-3, ry-3, 6, 6) } else { g.fillCircle(rx, ry, 3) } }
    }

    const hints = ['庇护', '生命', '重生', '神权']
    egyptMuralSlots.forEach((slot, idx) => {
      g.fillStyle(0x2a1a10, 0.95)
      g.fillRoundedRect(slot.x - slot.w / 2, slot.y - slot.h / 2, slot.w, slot.h, 4)
      g.lineStyle(3, 0x8a7050, 1)
      g.strokeRoundedRect(slot.x - slot.w / 2, slot.y - slot.h / 2, slot.w, slot.h, 4)

      this.add.text(slot.x, slot.y - slot.h / 2 - 18, hints[idx], {
        fontFamily: UI_FONT, fontSize: '15px', color: '#4a3020', backgroundColor: '#ebdcb5cc', padding: { x: 8, y: 4 },
      }).setOrigin(0.5).setDepth(200)

      const sunX = startX + 140
      const sunY = contentY + 50
      g.fillStyle(0xd4a338, 0.8) 
      g.fillCircle(sunX, sunY, 36)

      g.lineStyle(2, 0xd4a338, 0.5)
      for(let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2
        const rx1 = sunX + Math.cos(angle) * 42
        const ry1 = sunY + Math.sin(angle) * 42
        const rx2 = sunX + Math.cos(angle) * 56
        const ry2 = sunY + Math.sin(angle) * 56
        g.beginPath(); g.moveTo(rx1, ry1); g.lineTo(rx2, ry2); g.strokePath()
      }

      this.add.text(slot.x, slot.y - slot.h / 2 - 18, hints[idx], {
        fontFamily: UI_FONT, fontSize: '15px', color: '#4a3020', backgroundColor: '#ebdcb5cc', padding: { x: 8, y: 4 },
      }).setOrigin(0.5).setDepth(200)
    })
  }

  private buildHud() {
    const hud = roundedPanel(this, 28, 24, 360, 92).setDepth(2000)
    hud.setScrollFactor(0)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    this.add.text(48, 70, LEVEL.objective, { fontFamily: UI_FONT, fontSize: '16px', color: '#7d6354' }).setDepth(2001)
    this.add.text(1230, 38, '拖动下方象形符号 → 补全壁画残缺处', { fontFamily: UI_FONT, fontSize: '14px', color: '#efe6d8' }).setOrigin(1, 0).setDepth(2001).setAlpha(0.85)
    textButton(this, 1150, 100, '重 来', () => { this.scene.restart() })
  }

  private showKnowledgeCard() {
    if (this.overlayOpen) return
    this.overlayOpen = true
    showKnowledgeCard(this, LEVEL.knowledgeCard, () => { this.showAzhuComment() })
  }

  private showAzhuComment() {
    const box = this.add.container(640, 600).setDepth(5000).setAlpha(0)
    const panel = roundedPanel(this, -420, -44, 840, 88, palette.panel)
    const icon = this.add.text(-380, -12, '🌸', { fontSize: '24px' })
    const label = this.add.text(-340, -32, '阿筑', { fontFamily: UI_FONT, fontSize: '14px', color: '#b09a6e' })
    const body = this.add.text(-340, -10, LEVEL.azhuComment, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', wordWrap: { width: 740 } })
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
    // 🌟 标记通关 + 发钱
    LevelProgress.markCompleted(LEVEL.id)
    const isPerfect = this.attempts === 0
    const reward = CoinSystem.rewardLevel(LEVEL.id, isPerfect)
    CoinSystem.showFloatText(this, reward)

    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.38).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, LEVEL.successTitle, { fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, LEVEL.successBody, { fontFamily: UI_FONT, fontSize: '18px', color: '#6a635b', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5, 0).setDepth(5002)

    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'egypt-pyramid' })
    }).setDepth(5002)
  }
}