import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts' // 🌟 引入金币系统
import { paintPyramid } from '../world/paintPyramid.ts'
import { egyptDifferences, MURAL_BASE } from '../data/levels/egypt-spot.ts'

const LEVEL = {
  id: 'egypt-spot',
  chapter: '寻脉其四 · 其二',
  title: '文明破译',
  objective: '找出两幅祭祀壁画的 5 处差异',
  knowledgeCard: {
    title: '祭祀壁画的细节',
    content:
      '古埃及祭祀壁画中的每一个细节都有象征意义。\n' +
      '太阳的颜色象征神明的属性；人物与飞鸟象征灵魂的升降；\n' +
      '盾牌的缺失象征战争与和平的转换；鱼的数量象征尼罗河的丰饶。',
    source: '参考资料：《埃及亡灵书》（史实复核中）',
  },
  azhuComment: '看画如读文——细节处的差异，藏着古人的信仰。',
  successTitle: '文明破译',
  successBody: '五处差异全部找出。两幅壁画背后的祭祀密码，被你解开了。',
}

export class EgyptSpotScene extends Phaser.Scene {
  private overlayOpen = false
  private foundCount = 0
  private foundIds: Set<string> = new Set()
  private progressText!: Phaser.GameObjects.Text

  constructor() {
    super('EgyptSpotScene')
  }

  preload() {
    this.load.image('mural-left', 'assets/egypt-left.jpg')
    this.load.image('mural-right', 'assets/egypt-right.jpg')
  }

  create() {
    this.overlayOpen = false
    this.foundCount = 0
    this.foundIds = new Set()

    paintPyramid(this)

    this.add.image(MURAL_BASE.leftX, MURAL_BASE.y, 'mural-left')
      .setOrigin(0, 0).setDisplaySize(MURAL_BASE.w, MURAL_BASE.h).setDepth(100)

    this.add.image(MURAL_BASE.rightX, MURAL_BASE.y, 'mural-right')
      .setOrigin(0, 0).setDisplaySize(MURAL_BASE.w, MURAL_BASE.h).setDepth(100)

    const frame = this.add.graphics().setDepth(90)
    frame.lineStyle(6, 0x5a3a1a, 1)
    frame.strokeRect(MURAL_BASE.leftX - 4, MURAL_BASE.y - 4, MURAL_BASE.w + 8, MURAL_BASE.h + 8)
    frame.strokeRect(MURAL_BASE.rightX - 4, MURAL_BASE.y - 4, MURAL_BASE.w + 8, MURAL_BASE.h + 8)

    egyptDifferences.forEach((diff) => {
      const hitLeft = this.add.circle(MURAL_BASE.leftX + diff.localX, MURAL_BASE.y + diff.localY, diff.radius, 0x000000, 0.001)
        .setInteractive({ useHandCursor: true }).setDepth(200)
      hitLeft.on('pointerdown', () => {
        if (this.overlayOpen) return
        this.handleDifferenceClick(diff.id, diff.localX, diff.localY, diff.hint)
      })

      const hitRight = this.add.circle(MURAL_BASE.rightX + diff.localX, MURAL_BASE.y + diff.localY, diff.radius, 0x000000, 0.001)
        .setInteractive({ useHandCursor: true }).setDepth(200)
      hitRight.on('pointerdown', () => {
        if (this.overlayOpen) return
        this.handleDifferenceClick(diff.id, diff.localX, diff.localY, diff.hint)
      })
    })

    this.buildHud()
  }

  private handleDifferenceClick(id: string, localX: number, localY: number, hint: string) {
    if (this.foundIds.has(id)) {
      this.showToast(`已发现：${hint}`)
      return
    }

    this.foundIds.add(id)
    this.foundCount += 1
    this.updateProgress()

    const diff = egyptDifferences.find((d) => d.id === id)!
    const circles = this.add.graphics().setDepth(300)
    circles.lineStyle(4, 0xd04848, 0.9)
    circles.strokeCircle(MURAL_BASE.leftX + localX, MURAL_BASE.y + localY, diff.radius)
    circles.strokeCircle(MURAL_BASE.rightX + localX, MURAL_BASE.y + localY, diff.radius)

    this.floatText(MURAL_BASE.leftX + localX, MURAL_BASE.y + localY, hint)
    this.showToast(`命中：${hint}`)

    if (this.foundCount >= egyptDifferences.length) {
      this.time.delayedCall(800, () => this.showKnowledgeCard())
    }
  }

  private updateProgress() {
    if (this.progressText) this.progressText.setText(`已找：${this.foundCount} / ${egyptDifferences.length}`)
  }

  private floatText(x: number, y: number, text: string) {
    const t = this.add.text(x, y - 20, text, { fontFamily: UI_FONT, fontSize: '14px', color: '#d04848', backgroundColor: '#f3e8cfee', padding: { x: 8, y: 4 } }).setOrigin(0.5).setDepth(4000).setAlpha(0)
    this.tweens.add({
      targets: t, alpha: 1, y: y - 50, duration: 500,
      onComplete: () => { this.tweens.add({ targets: t, alpha: 0, duration: 500, onComplete: () => t.destroy() }) },
    })
  }

  private buildHud() {
    const hud = roundedPanel(this, 28, 24, 360, 92).setDepth(2000)
    hud.setScrollFactor(0)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    this.add.text(48, 70, LEVEL.objective, { fontFamily: UI_FONT, fontSize: '16px', color: '#7d6354' }).setDepth(2001)

    this.progressText = this.add.text(1170, 48, `已找：0 / 5`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', backgroundColor: '#efe6d8ee', padding: { x: 12, y: 6 } }).setOrigin(0.5).setDepth(2001)

    textButton(this, 1180, 120, '重 来', () => { this.scene.restart() })
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
    // 🌟 标记通关 + 发钱（找茬没有完美判定，只要通关就给基础金币）
    LevelProgress.markCompleted(LEVEL.id)
    const reward = CoinSystem.rewardLevel(LEVEL.id, true)
    CoinSystem.showFloatText(this, reward)

    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.38).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, LEVEL.successTitle, { fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, LEVEL.successBody, { fontFamily: UI_FONT, fontSize: '18px', color: '#6a635b', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5, 0).setDepth(5002)

    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'egypt-pyramid' })
    }).setDepth(5002)
  }

  private showToast(msg: string) {
    const t = this.add.text(640, 120, msg, { fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f', backgroundColor: '#efe6d8ee', padding: { x: 14, y: 8 }, wordWrap: { width: 720 }, align: 'center' }).setOrigin(0.5).setDepth(4000).setAlpha(0)
    this.tweens.add({ targets: t, alpha: 1, y: 108, duration: 220, yoyo: true, hold: 1400, onComplete: () => t.destroy() })
  }
}