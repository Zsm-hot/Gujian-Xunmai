import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { paintWood } from '../world/paintWood.ts'
import { woodTimberLevel } from '../data/levels/wood-timber.ts'
import { isoToScreen } from '../iso.ts'
import type { TimberLevelConfig } from '../types.ts'
import { CoinSystem } from '../systems/CoinSystem.ts'

export class WoodTimberScene extends Phaser.Scene {
  private level!: TimberLevelConfig
  private overlayOpen = false
  private dialogueIndex = 0

  private timberNodes: Map<string, Phaser.GameObjects.Container> = new Map()
  private categoryNodes: Map<string, Phaser.GameObjects.Container> = new Map()
  private placed: Set<string> = new Set()

  private draggingTimberId: string | null = null
  private categoryPlacedCount: Map<string, number> = new Map()  
  constructor() {
    super('WoodTimberScene')
  }

  create() {
    this.level = woodTimberLevel
    this.overlayOpen = false
    this.dialogueIndex = 0
    this.timberNodes = new Map()
    this.categoryNodes = new Map()
    this.placed = new Set()
    this.draggingTimberId = null

    this.categoryPlacedCount = new Map()
    for (const cat of this.level.categories) {
      this.categoryPlacedCount.set(cat.id, 0)
    }
    // 背景
    paintWood(this)

    // UI 面板
    const uiBg = this.add.graphics().setDepth(900)
    uiBg.fillStyle(palette.paper, 0.78)
    uiBg.fillRoundedRect(160, 140, 960, 500, 20)
    uiBg.lineStyle(2, palette.gold, 0.5)
    uiBg.strokeRoundedRect(160, 140, 960, 500, 20)
    // ★ 右侧提示区
    const tips = [
      '① 关于柱子：\n「终日受地气潮气，木料需耐潮抗腐」',
      '② 关于梁：\n「弯曲受力最重，绵软木料不可选用」',
      '③ 关于斗拱：\n「无数细小榫咬合，木料过脆会崩口碎裂」',
    ]

      // ★ 右侧提示区（面板加宽 + 字体加大）
    const panelX = 1080
    const panelW = 190

    const tipsBg = this.add.graphics().setDepth(900)
    tipsBg.fillStyle(palette.panel, 0.95)
    tipsBg.fillRoundedRect(panelX, 160, panelW, 460, 12)
    tipsBg.lineStyle(2, palette.gold, 0.6)
    tipsBg.strokeRoundedRect(panelX, 160, panelW, 460, 12)

    this.add
      .text(panelX + panelW / 2, 182, '选 材 要 诀', {
        fontFamily: UI_FONT,
        fontSize: '16px',
        color: '#b09a6e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(901)

    tips.forEach((tip, i) => {
      this.add
        .text(panelX + 14, 215 + i * 145, tip, {
          fontFamily: UI_FONT,
          fontSize: '15px',
          color: '#5a5148',
          wordWrap: { width: panelW - 28, useAdvancedWrap: true },
          align: 'left',
          lineSpacing: 6,
        })
        .setDepth(901)
    })
    this.add
      .text(640, 168, '· 良 材 甄 选 ·', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#8d7164',
      })
      .setOrigin(0.5)
      .setDepth(901)

    // NPC
    this.createNpc()

    // 3 个"篮子"（分类槽）
    for (const cat of this.level.categories) {
      const pos = isoToScreen(cat.tx, cat.ty)
      const node = this.createCategoryNode(cat.id, cat.name, pos.x, pos.y)
      this.categoryNodes.set(cat.id, node)
    }

    // 6 个"木材卡片"（初始随机排列在"上方"）
    this.createTimberCards()

    // HUD
    this.buildHud()

    // 全局 pointermove / pointerup
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.draggingTimberId) return
      const node = this.timberNodes.get(this.draggingTimberId)
      if (node) node.setPosition(pointer.x, pointer.y)
    })

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.draggingTimberId) return
      const timberId = this.draggingTimberId
      const node = this.timberNodes.get(timberId)
      this.draggingTimberId = null

      if (!node) return

      // 找最近"篮子"
      const nearest = this.findNearestCategory(pointer.x, pointer.y)
      if (!nearest) {
        this.returnTimberHome(node)
        return
      }

      // 判断对错
      const timber = this.level.timbers.find((t) => t.id === timberId)
      if (!timber) return

      if (timber.categoryId === nearest.id) {
        // ★ 按"篮子已放数"决定位置（两个并排）
        const placedCount = this.categoryPlacedCount.get(nearest.id) ?? 0
        const offsetX = placedCount === 0 ? -22 : 22
        node.setPosition(nearest.x + offsetX, nearest.y + 10)
        node.setScale(0.65)
        node.setData('locked', true)
        this.placed.add(timberId)
        this.categoryPlacedCount.set(nearest.id, placedCount + 1)
        this.showToast(`「${timber.name}」放入「${nearest.name}」`)
        this.checkComplete()
      } else {
        // 放错
        this.showToast(`「${timber.name}」不属于「${nearest.name}」`)
        this.returnTimberHome(node)
      }
    })

    // 初始布局
    this.layoutTimberCards()
  }

  // ===== NPC =====
  private createNpc() {
    const npc = this.level.npc
    const pos = isoToScreen(npc.position.tx, npc.position.ty)
    const root = this.add.container(pos.x, pos.y).setDepth(1500)

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

  // ===== 分类槽（篮子） =====
  private createCategoryNode(
    _id: string,
    name: string,
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const root = this.add.container(x, y).setDepth(1500)

    // 竹篮（一个"方盒"）
    const basket = this.add.graphics()
    // 底
    basket.fillStyle(0xb88a5a, 0.9)
    basket.fillRoundedRect(-55, -40, 110, 70, 8)
    // 边框
    basket.lineStyle(3, 0x6a4a24, 1)
    basket.strokeRoundedRect(-55, -40, 110, 70, 8)
    // 竹编纹（横线）
    basket.lineStyle(1, 0x6a4a24, 0.5)
    for (let i = 0; i < 3; i += 1) {
      basket.beginPath()
      basket.moveTo(-55, -40 + (i + 1) * 17)
      basket.lineTo(55, -40 + (i + 1) * 17)
      basket.strokePath()
    }
    root.add(basket)

    // 名字（在篮子上）
    const label = this.add
      .text(0, 0, name, {
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#efe6d8',
      })
      .setOrigin(0.5)
    root.add(label)

    return root
  }

  // ===== 木材卡片 =====
  private createTimberCards() {
    for (const timber of this.level.timbers) {
      const node = this.createTimberCard(timber.id, timber.name, timber.icon)
      this.timberNodes.set(timber.id, node)
    }
  }

   private createTimberCard(
    id: string,
    name: string,
    _icon: string,
  ): Phaser.GameObjects.Container {
    const w = 100
    const h = 80

    const root = this.add.container(0, 0).setDepth(2500)

    const bg = this.add.graphics()
    bg.fillStyle(palette.panel, 0.96)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8)
    bg.lineStyle(2, palette.gold, 0.8)
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8)
    root.add(bg)

    // ★ 按"木材 id"绘制不同特征的树
    const trunk = this.add.graphics()
    this.drawTimberIcon(trunk, id)

    root.add(trunk)

    const nameText = this.add
      .text(22, 20, name, {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#4a453f',
      })
      .setOrigin(0.5)
    root.add(nameText)

    const hit = this.add
      .rectangle(0, 0, w, h, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true })
    root.add(hit)

    root.setData('timberId', id)
    root.setData('homeX', 0)
    root.setData('homeY', 0)
    root.setData('locked', false)

    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.overlayOpen) return
      if (root.getData('locked')) return
      if (this.draggingTimberId) return
      this.draggingTimberId = id
      root.setDepth(3500)
      root.setScale(1.05)
      root.setPosition(pointer.x, pointer.y)
    })

    return root
  }

  /** 按木材 id 画不同"树种" */
  private drawTimberIcon(g: Phaser.GameObjects.Graphics, id: string) {
    switch (id) {
      case 't1': // 松木 —— 深棕细直 + 深绿尖叶
        this.drawTree(g, 0x5a3a1a, 0x2a4a2a, 'tall', 10, 40)
        break
      case 't2': // 柏木 —— 灰棕粗 + 翠绿圆
        this.drawTree(g, 0x7a5a3a, 0x3a6a4a, 'round', 14, 36)
        break
      case 't3': // 杉木 —— 红棕 + 浅绿细
        this.drawTree(g, 0x8a4a2a, 0x6a9a5a, 'thin', 10, 42)
        break
      case 't4': // 榆木 —— 黄棕粗 + 深绿宽
        this.drawTree(g, 0xa87040, 0x4a7a4a, 'wide', 14, 38)
        break
      case 't5': // 楠木 —— 深红棕 + 亮绿厚
        this.drawTree(g, 0x8a3a1a, 0x7ac868, 'bush', 12, 36)
        break
      case 't6': // 柞木 —— 灰褐粗 + 黄绿锯齿
        this.drawTree(g, 0x6a5a4a, 0x8a9a4a, 'jagged', 14, 38)
        break
      default:
        this.drawTree(g, 0x8a5a30, 0x4a6a4a, 'round', 12, 38)
    }
  }

  /** 通用"树"绘制 */
  private drawTree(
    g: Phaser.GameObjects.Graphics,
    trunkColor: number,
    leafColor: number,
    leafShape: 'tall' | 'round' | 'thin' | 'wide' | 'bush' | 'jagged',
    trunkW: number,
    trunkH: number,
  ) {
    const x = -34
    const y = -22

    // 树干
    g.fillStyle(trunkColor, 1)
    g.fillRect(x - trunkW / 2, y, trunkW, trunkH)

    // 树皮纹理（几条深色竖线）
    g.lineStyle(1, 0x3a2a1a, 0.5)
    for (let i = 0; i < trunkW / 3; i += 1) {
      g.beginPath()
      g.moveTo(x - trunkW / 2 + i * 3 + 2, y + 4)
      g.lineTo(x - trunkW / 2 + i * 3 + 2, y + trunkH - 4)
      g.strokePath()
    }

    // 年轮顶（顶端小椭圆）
    g.fillStyle(0x8a5a30, 1)
    g.fillEllipse(x, y, trunkW, 4)

    // 根
    g.fillStyle(trunkColor, 1)
    g.fillRect(x - trunkW / 2 - 4, y + trunkH - 4, trunkW + 8, 4)

    // 树冠（按形状不同）
    const leafCx = x
    const leafCy = y - 14

    switch (leafShape) {
      case 'tall': // 尖塔（松）
        g.fillStyle(leafColor, 1)
        g.fillTriangle(
          leafCx, leafCy - 16,
          leafCx - 14, leafCy + 4,
          leafCx + 14, leafCy + 4,
        )
        g.fillTriangle(
          leafCx, leafCy - 22,
          leafCx - 10, leafCy - 4,
          leafCx + 10, leafCy - 4,
        )
        break
      case 'round': // 圆团（柏）
        g.fillStyle(leafColor, 1)
        g.fillCircle(leafCx, leafCy - 4, 14)
        g.fillCircle(leafCx - 8, leafCy + 2, 10)
        g.fillCircle(leafCx + 8, leafCy + 2, 10)
        break
      case 'thin': // 细长（杉）
        g.fillStyle(leafColor, 1)
        g.fillEllipse(leafCx, leafCy - 6, 16, 30)
        break
      case 'wide': // 宽冠（榆）
        g.fillStyle(leafColor, 1)
        g.fillEllipse(leafCx, leafCy, 36, 22)
        break
      case 'bush': // 密团（楠）
        g.fillStyle(leafColor, 1)
        g.fillCircle(leafCx - 8, leafCy, 12)
        g.fillCircle(leafCx + 8, leafCy, 12)
        g.fillCircle(leafCx, leafCy - 8, 14)
        g.fillCircle(leafCx, leafCy + 4, 12)
        break
      case 'jagged': // 锯齿（柞）
        g.fillStyle(leafColor, 1)
        g.beginPath()
        g.moveTo(leafCx - 16, leafCy)
        g.lineTo(leafCx - 10, leafCy - 14)
        g.lineTo(leafCx - 2, leafCy - 8)
        g.lineTo(leafCx + 6, leafCy - 16)
        g.lineTo(leafCx + 14, leafCy - 6)
        g.lineTo(leafCx + 18, leafCy + 4)
        g.lineTo(leafCx + 6, leafCy + 10)
        g.lineTo(leafCx - 6, leafCy + 10)
        g.lineTo(leafCx - 16, leafCy + 4)
        g.closePath()
        g.fillPath()
        break
    }
  }
  // ===== 布局木材卡片（上方两排） =====
  private layoutTimberCards() {
    const cardW = 110
    const gapX = 20
    const gapY = 25
    const cols = 3
    const startY = 260

    this.level.timbers.forEach((timber, i) => {
      const node = this.timberNodes.get(timber.id)
      if (!node) return

      const col = i % cols
      const row = Math.floor(i / cols)

      const x = 640 + (col - (cols - 1) / 2) * (cardW + gapX)
      const y = startY + row * (80 + gapY)

      node.setPosition(x, y)
      node.setData('homeX', x)
      node.setData('homeY', y)
    })
  }

  // ===== 找最近的分类槽 =====
  private findNearestCategory(
    x: number,
    y: number,
  ): { id: string; name: string; x: number; y: number } | null {
    let best: { id: string; name: string; x: number; y: number; dist: number } | null = null

    for (const cat of this.level.categories) {
      const pos = isoToScreen(cat.tx, cat.ty)
      const d = Math.hypot(pos.x - x, pos.y - y)
      if (d < 100) {
        if (!best || d < best.dist) {
          best = { id: cat.id, name: cat.name, x: pos.x, y: pos.y, dist: d }
        }
      }
    }

    return best ? { id: best.id, name: best.name, x: best.x, y: best.y } : null
  }

  private returnTimberHome(node: Phaser.GameObjects.Container) {
    node.setDepth(2500)
    node.setScale(1)
    this.tweens.add({
      targets: node,
      x: node.getData('homeX') as number,
      y: node.getData('homeY') as number,
      duration: 300,
      ease: 'Back.easeOut',
    })
  }

  private checkComplete() {
    if (this.placed.size >= this.level.timbers.length) {
      this.time.delayedCall(500, () => this.showKnowledgeCard())
    }
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
      .text(1230, 38, '拖动木材 → 放入对应篮子', {
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
 const isPerfect = true 
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