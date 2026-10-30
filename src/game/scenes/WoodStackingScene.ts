import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { paintWood } from '../world/paintWood.ts'
import { woodStackingLevel } from '../data/levels/wood-stacking.ts'
import type { StackLevelConfig, StackPartConfig } from '../types.ts'
import { CoinSystem } from '../systems/CoinSystem.ts'

// 底座位置（屏幕中央偏下）
const BASE_X = 640
const BASE_Y = 560

export class WoodStackingScene extends Phaser.Scene {
  private level!: StackLevelConfig
  private overlayOpen = false
  private dialogueIndex = 0

  private currentOrder = 1          // 当前应该放第几个（1~5）
  private placedParts: StackPartConfig[] = []   // 已叠上的构件
  private partNodes: Map<string, Phaser.GameObjects.Container> = new Map()

  private draggingPartId: string | null = null
  private baseRef!: Phaser.GameObjects.Container

  constructor() {
    super('WoodStackingScene')
  }

  create() {
    this.level = woodStackingLevel
    this.overlayOpen = false
    this.dialogueIndex = 0
    this.currentOrder = 1
    this.placedParts = []
    this.partNodes = new Map()
    this.draggingPartId = null

    // 背景
    paintWood(this)

    // UI 面板
    const uiBg = this.add.graphics().setDepth(900)
    uiBg.fillStyle(palette.paper, 0.78)
    uiBg.fillRoundedRect(160, 140, 960, 500, 20)
    uiBg.lineStyle(2, palette.gold, 0.5)
    uiBg.strokeRoundedRect(160, 140, 960, 500, 20)

    this.add
      .text(640, 168, '· 层 叠 筑 塔 ·', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#8d7164',
      })
      .setOrigin(0.5)
      .setDepth(901)
    // ★ 右侧"营造口诀"提示
    const tipBg = this.add.graphics().setDepth(900)
    tipBg.fillStyle(palette.panel, 0.92)
    tipBg.fillRoundedRect(1040, 180, 200, 200, 12)
    tipBg.lineStyle(2, palette.gold, 0.6)
    tipBg.strokeRoundedRect(1040, 180, 200, 200, 12)

    this.add
      .text(1140, 205, '· 营 造 口 诀 ·', {
        fontFamily: UI_FONT,
        fontSize: '15px',
        color: '#b09a6e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(901)

    this.add
      .text(
        1140,
        240,
        '凡营建之法，\n先奠其基，再筑其构；\n先理其内，再扩其外。',
        {
          fontFamily: UI_FONT,
          fontSize: '16px',
          color: '#4a453f',
          align: 'center',
          lineSpacing: 8,
          wordWrap: { width: 170, useAdvancedWrap: true },
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(901)

    // NPC
    this.createNpc()

    // 建"底座"
    this.createBase()

    // 建"5 个构件卡片"（乱序在底部一排）
    this.createPartCards()

    // HUD
    this.buildHud()

    // 全局 pointermove / pointerup
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.draggingPartId) return
      const node = this.partNodes.get(this.draggingPartId)
      if (node) node.setPosition(pointer.x, pointer.y)
    })

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.draggingPartId) return
      const partId = this.draggingPartId
      const node = this.partNodes.get(partId)
      this.draggingPartId = null

      if (!node) return

      // 判断"是否拖到底座附近"（x 在 ±60，y 在 ±60）
      const dist = Math.hypot(pointer.x - BASE_X, pointer.y - BASE_Y)
      if (dist > 120) {
        this.returnHome(node, partId)
        return
      }

      // 找"对应构件"
      const part = this.level.parts.find((p) => p.id === partId)
      if (!part) return

      // 判断"顺序"
      if (part.orderIndex === this.currentOrder) {
        // 正确！
        this.placePart(part, node)
      } else {
        // 错误
        const expected = this.level.parts.find((p) => p.orderIndex === this.currentOrder)
        this.showToast(`顺序不对——应先「${expected?.name ?? ''}」`)
        this.returnHome(node, partId)
      }
    })
  }

  // ===== NPC =====
  private createNpc() {
    const npc = this.level.npc
    const root = this.add.container(220, 460).setDepth(1500)

    const bg = this.add.graphics()
    bg.fillStyle(palette.timber, 1)
    bg.fillRoundedRect(-30, -50, 60, 60, 8)
    root.add(bg)

    const face = this.add.text(0, -20, '🧔', { fontSize: '32px' }).setOrigin(0.5)
    root.add(face)

    const label = this.add
      .text(0, 20, npc.name, {
        fontFamily: UI_FONT,
        fontSize: '13px',
        color: '#efe6d8',
        backgroundColor: '#4a453fee',
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5)
    root.add(label)

    const hit = this.add
      .circle(0, -20, 36, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true })
    root.add(hit)

    hit.on('pointerup', () => {
      if (this.overlayOpen) return
      this.openDialogue(0)
    })
  }

  // ===== 底座 =====
  private createBase() {
    this.baseRef = this.add.container(BASE_X, BASE_Y + 20).setDepth(1000)

    // 底座（圆台）
    const g = this.add.graphics()
    g.fillStyle(0xa8a090, 1)
    g.fillEllipse(0, 10, 160, 40)
    g.lineStyle(2, 0x6a5a4a, 1)
    g.strokeEllipse(0, 10, 160, 40)

    // 底座文字
    this.baseRef.add(g)
    const label = this.add
      .text(0, 36, '塔 底', {
        fontFamily: UI_FONT,
        fontSize: '13px',
        color: '#4a453f',
        backgroundColor: '#efe6d8dd',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
    this.baseRef.add(label)
  }

  // ===== 构件卡片 =====
  private createPartCards() {
    const shuffled = [...this.level.parts].sort(() => Math.random() - 0.5)

    const cardW = 110
    const cardH = 70
    const gap = 20
    const totalW = shuffled.length * cardW + (shuffled.length - 1) * gap
    const startX = 640 - totalW / 2 + cardW / 2
    const y = 650

    shuffled.forEach((part, i) => {
      const x = startX + i * (cardW + gap)
      const node = this.createPartCard(part, x, y, cardW, cardH)
      this.partNodes.set(part.id, node)
    })
  }

  private createPartCard(
    part: StackPartConfig,
    x: number,
    y: number,
    w: number,
    h: number,
  ): Phaser.GameObjects.Container {
    const root = this.add.container(x, y).setDepth(2500)

    const bg = this.add.graphics()
    bg.fillStyle(palette.panel, 0.96)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8)
    bg.lineStyle(2, palette.gold, 0.8)
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8)
    root.add(bg)

    const icon = this.add.text(0, -10, part.icon, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#4a453f',
    }).setOrigin(0.5)
    root.add(icon)

    const name = this.add.text(0, 22, part.name, {
      fontFamily: UI_FONT,
      fontSize: '14px',
      color: '#4a453f',
    }).setOrigin(0.5)
    root.add(name)

    const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0.001).setInteractive({ useHandCursor: true })
    root.add(hit)

    root.setData('partId', part.id)
    root.setData('homeX', x)
    root.setData('homeY', y)
    root.setData('locked', false)

    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.overlayOpen) return
      if (root.getData('locked')) return
      if (this.draggingPartId) return
      this.draggingPartId = part.id
      root.setDepth(3500)
      root.setScale(1.05)
      root.setPosition(pointer.x, pointer.y)
    })

    return root
  }

  // ===== 放对（叠上去） =====
  private placePart(part: StackPartConfig, node: Phaser.GameObjects.Container) {
    this.placedParts.push(part)

    // 计算"叠到"哪
    let baseY = BASE_Y
    for (const p of this.placedParts.slice(0, -1)) {
      baseY -= p.height
    }
    const targetY = baseY - part.height / 2

    // ★ 视觉：变为"已放置"状态（更大、去底、锁定）
    node.setScale(1.2)
    node.setDepth(1200 + this.placedParts.length)
    node.setData('locked', true)
    
      // ★ 把底去掉，根据 part.id 画出"真实的木构形状"
    node.list.forEach((child) => {
      if (child) child.destroy()
    })

    const g = this.add.graphics()
    const h = part.height
    const w = 160

    if (part.id === 'p1') {
      // 基底：宽大的石台
      g.fillStyle(0xc8c0b0, 1)
      g.fillRect(-w / 2, -h / 2, w, h)
      g.lineStyle(2, 0x8a8272, 1)
      g.strokeRect(-w / 2, -h / 2, w, h)
    } else if (part.id === 'p2') {
      // 内槽柱：两根细长红柱
      g.fillStyle(0xa84838, 1)
      g.fillRect(-30, -h / 2, 8, h)
      g.fillRect(22, -h / 2, 8, h)
    } else if (part.id === 'p3') {
      // 外槽柱：两根宽柱
      g.fillStyle(0xc85848, 1)
      g.fillRect(-60, -h / 2, 12, h)
      g.fillRect(48, -h / 2, 12, h)
    } else if (part.id === 'p4') {
      // 横梁：横跨的长条
      g.fillStyle(0x8a3828, 1)
      g.fillRect(-80, -h / 2, 160, h)
      g.lineStyle(2, 0x5a2018, 1)
      g.strokeRect(-80, -h / 2, 160, h)
    } else if (part.id === 'p5') {
      // 斜撑：两个斜条
      g.fillStyle(0x5a2018, 1)
      g.beginPath()
      g.moveTo(-60, h / 2); g.lineTo(-40, -h / 2); g.lineTo(-30, -h / 2); g.lineTo(-50, h / 2)
      g.closePath(); g.fillPath()
      g.beginPath()
      g.moveTo(60, h / 2); g.lineTo(40, -h / 2); g.lineTo(30, -h / 2); g.lineTo(50, h / 2)
      g.closePath(); g.fillPath()
    }
    node.addAt(g, 0)
    
    // 动画：飞到目标位置
    this.tweens.add({
      targets: node,
      x: BASE_X,
      y: targetY,
      duration: 250,
      ease: 'Back.easeOut',
    })

    this.currentOrder += 1
    this.showToast(`「${part.name}」归位`)

    if (this.currentOrder > 5) {
      this.time.delayedCall(800, () => this.showKnowledgeCard())
    }
  }

  private returnHome(node: Phaser.GameObjects.Container, _partId: string) {
    node.setDepth(2500)
    node.setScale(1)
    this.tweens.add({
      targets: node,
      x: node.getData('homeX') as number,
      y: node.getData('homeY') as number,
      duration: 300,
      ease: 'Back.easeOut',
    })
    this.showToast('顺序不对，请重试')
  }

  // ===== HUD =====
  private buildHud() {
    const hud = roundedPanel(this, 28, 24, 360, 92).setDepth(2000)
    hud.setScrollFactor(0)

    this.add
      .text(48, 38, `${this.level.chapter} · ${this.level.title}`, {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: '#4a453f',
      })
      .setDepth(2001)

    this.add
      .text(48, 70, this.level.objective, {
        fontFamily: UI_FONT,
        fontSize: '16px',
        color: '#7d6354',
      })
      .setDepth(2001)

    this.add
      .text(1230, 38, '按顺序，从底往上叠', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#efe6d8',
      })
      .setOrigin(1, 0)
      .setDepth(2001)
      .setAlpha(0.85)

    textButton(this, 1150, 100, '重 来', () => {
      this.scene.restart()
    })
  }

  // ===== 对话 =====
  private openDialogue(startIndex: number) {
    this.dialogueIndex = startIndex
    const line = this.level.npc.dialogue[this.dialogueIndex]
    if (!line) return

    this.children.getByName('dialogue')?.destroy()

    const root = this.add.container(0, 0).setDepth(3000).setName('dialogue')
    const panel = roundedPanel(this, 140, 520, 1000, 160)
    const speaker = this.add.text(168, 540, line.speaker, {
      fontFamily: UI_FONT,
      fontSize: '18px',
      color: '#8d7164',
    })
    const body = this.add.text(168, 574, line.text, {
      fontFamily: UI_FONT,
      fontSize: '20px',
      color: '#4a453f',
      wordWrap: { width: 880 },
    })
    const hint = this.add.text(980, 640, '点击继续', {
      fontFamily: UI_FONT,
      fontSize: '14px',
      color: '#7d6354',
    })
    root.add([panel, speaker, body, hint])

    const hit = this.add
      .zone(640, 600, 1000, 160)
      .setInteractive({ useHandCursor: true })
    root.add(hit)
    hit.on('pointerup', () => this.advanceDialogue())
  }

  private advanceDialogue() {
    this.dialogueIndex += 1
    if (this.dialogueIndex >= this.level.npc.dialogue.length) {
      this.children.getByName('dialogue')?.destroy()
      return
    }
    this.openDialogue(this.dialogueIndex)
  }

  // ===== 知识卡 / 阿筑 / 成功 =====
  private showKnowledgeCard() {
    if (this.overlayOpen) return
    this.overlayOpen = true

    showKnowledgeCard(this, this.level.knowledgeCard, () => {
      this.showAzhuComment()
    })
  }

  private showAzhuComment() {
    const box = this.add.container(640, 600).setDepth(5000).setAlpha(0)
    const panel = roundedPanel(this, -420, -44, 840, 88, palette.panel)
    const icon = this.add.text(-380, -12, '🌸', { fontSize: '24px' })
    const label = this.add.text(-340, -32, '阿筑', {
      fontFamily: UI_FONT,
      fontSize: '14px',
      color: '#b09a6e',
    })
    const body = this.add.text(-340, -10, this.level.azhuComment, {
      fontFamily: UI_FONT,
      fontSize: '18px',
      color: '#4a453f',
      wordWrap: { width: 740 },
    })
    box.add([panel, icon, label, body])

    this.tweens.add({
      targets: box,
      alpha: 1,
      y: 588,
      duration: 320,
      onComplete: () => {
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: box,
            alpha: 0,
            y: 620,
            duration: 320,
            onComplete: () => {
              box.destroy()
              this.showSuccess()
            },
          })
        })
      },
    })
  }

  private showSuccess() {
    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.38).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add
      .text(640, 230, this.level.successTitle, {
        fontFamily: UI_FONT,
        fontSize: '32px',
        color: '#4a453f',
      })
      .setOrigin(0.5)
      .setDepth(5002)
    this.add
      .text(640, 300, this.level.successBody, {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: '#6a635b',
        wordWrap: { width: 560 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(5002)

    LevelProgress.markCompleted(this.level.id)
   const isPerfect = true // 如果有错拼次数，请替换为 this.attempts === 0
    const reward = CoinSystem.rewardLevel(this.level.id, isPerfect)
    CoinSystem.showFloatText(this, reward)
    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'yingxian-pagoda' })
    }).setDepth(5002)
  }

  private showToast(msg: string) {
    const t = this.add
      .text(640, 120, msg, {
        fontFamily: UI_FONT,
        fontSize: '16px',
        color: '#4a453f',
        backgroundColor: '#efe6d8ee',
        padding: { x: 14, y: 8 },
        wordWrap: { width: 720 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(4000)
      .setAlpha(0)

    this.tweens.add({
      targets: t,
      alpha: 1,
      y: 108,
      duration: 220,
      yoyo: true,
      hold: 1400,
      onComplete: () => t.destroy(),
    })
  }
}