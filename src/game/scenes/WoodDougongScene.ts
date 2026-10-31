import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { paintWood } from '../world/paintWood.ts'
import { woodDougongLevel } from '../data/levels/wood-dougong.ts'
import type { DougongLevelConfig } from '../types.ts'
import { CoinSystem } from '../systems/CoinSystem.ts'

// 塔底座位置
const SLOT_Y = 560
// 下落起点
const TOP_Y = 180
// 下落速度（毫秒），初始 1800，每落一次 -120
const FALL_DURATION_BASE = 1800
const FALL_DURATION_STEP = 120

export class WoodDougongScene extends Phaser.Scene {
  private level!: DougongLevelConfig & { shapes: any[] }
  private overlayOpen = false
  private dialogueIndex = 0
  private completed = false

  private currentIndex = 0
  private combo = 0
  private stackHeight: Map<string, number> = new Map()
  private currentPiece!: Phaser.GameObjects.Container
  private pieceX = 640
  private isDropping = false
  private slotRefs: Phaser.GameObjects.Container[] = []

  // HUD 文字
  private hudStepText!: Phaser.GameObjects.Text
  private hudComboText!: Phaser.GameObjects.Text

  constructor() {
    super('WoodDougongScene')
  }

  create() {
    this.level = woodDougongLevel as any
    this.overlayOpen = false
    this.dialogueIndex = 0
    this.completed = false
    this.currentIndex = 0
    this.combo = 0
    this.isDropping = false
    this.slotRefs = []
    // 背景
    paintWood(this)

    // 底部卡槽层（虚线框）
    this.buildSlots()

    // UI 面板（只覆盖上半部分，露出底部卡槽）
    const uiBg = this.add.graphics().setDepth(900)
    uiBg.fillStyle(palette.paper, 0.6)
    uiBg.fillRoundedRect(160, 140, 960, 360, 20)
    uiBg.lineStyle(2, palette.gold, 0.5)
    uiBg.strokeRoundedRect(160, 140, 960, 360, 20)

    // NPC
    this.createNpc()

    // HUD
    this.buildHud()

    // 全局 pointermove：移动当前斗拱
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.overlayOpen || !this.currentPiece || !this.isDropping) return
      // 只在水平方向移动，限制在屏幕内
      this.pieceX = Phaser.Math.Clamp(pointer.x, 80, 1200)
      this.currentPiece.x = this.pieceX
    })

    // 开始第一次下落
    this.time.delayedCall(600, () => this.spawnNextPiece())
  }

  // ===== 底部卡槽 =====
  private buildSlots() {
    for (const slot of this.level.slots) {
      const container = this.add.container(slot.x, SLOT_Y).setDepth(1000)
      this.slotRefs.push(container)

      // 槽底座（更大的椭圆）
      const base = this.add.graphics()
      base.fillStyle(0x8a5a30, 0.6)
      base.fillEllipse(0, 20, 130, 40)
      base.lineStyle(2, 0x5a3a1a, 0.7)
      base.strokeEllipse(0, 20, 130, 40)
      container.add(base)

      // ★ 画"主形状"（大 + 半透明）—— 用"第一个形状"
      const mainShapeId = slot.shapeIds[0]
      const mainShape = this.level.shapes.find((s: any) => s.id === mainShapeId)
      if (mainShape) {
        const shapeG = this.add.graphics()
        mainShape.drawShape(shapeG)
        shapeG.setAlpha(0.35)
        shapeG.setPosition(0, -20)
        container.add(shapeG)
      }

      // 提示："接受形状" 小字（用文字提示，不画多个形状）
      const shapeNames = slot.shapeIds
        .map((id: string) => this.level.shapes.find((s: any) => s.id === id)?.name ?? '')
        .filter(Boolean)
        .join(' / ')

      const label = this.add
        .text(0, 55, shapeNames, {
          fontFamily: UI_FONT,
          fontSize: '11px',
          color: '#5a3a1a',
          backgroundColor: '#efe6d8cc',
          padding: { x: 6, y: 2 },
        })
        .setOrigin(0.5)
      container.add(label)
    }
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

    // 进度
    this.hudStepText = this.add
      .text(640, 220, '', {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: '#4a453f',
        backgroundColor: '#efe6d8ee',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(2001)

    // 连击
    this.hudComboText = this.add
      .text(640, 270, '', {
        fontFamily: UI_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#d04848',
        backgroundColor: '#f3e8cfee',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(2001)
      .setAlpha(0)

    // 提示
    this.add
      .text(1230, 38, '滑动鼠标 → 对准虚线框下落', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#efe6d8',
      })
      .setOrigin(1, 0)
      .setDepth(2001)
      .setAlpha(0.85)

    // 重来
    textButton(this, 1150, 100, '重 来', () => {
      this.scene.restart()
    })

    this.refreshHud()
  }

  private refreshHud() {
    this.hudStepText.setText(`第 ${this.currentIndex} / ${this.level.sequence.length} 落`)
    if (this.combo > 1) {
      this.hudComboText.setText(`连击 x${this.combo}`).setAlpha(1)
    } else {
      this.hudComboText.setAlpha(0)
    }
  }

  // ===== 生成下一个斗拱 =====
  private spawnNextPiece() {
    if (this.currentIndex >= this.level.sequence.length) {
      this.completeLevel()
      return
    }

    const shapeId = this.level.sequence[this.currentIndex]
    const shape = this.level.shapes.find((s: any) => s.id === shapeId)
    if (!shape) return

    // 创建一个 Container 包含斗拱
    this.currentPiece = this.add.container(this.pieceX, TOP_Y).setDepth(2000)

    const g = this.add.graphics()
    shape.drawShape(g)
    this.currentPiece.add(g)

    // 给斗拱一个“影子”（底下的虚线框，辅助瞄准）
    const shadow = this.add.graphics()
    shadow.lineStyle(2, 0xd4a338, 0.4)
    shadow.strokeRect(-40, -40, 80, 80)
    this.currentPiece.addAt(shadow, 0) // 放在最底层

    // 开始下落
    this.isDropping = true
    this.tweens.add({
      targets: this.currentPiece,
      y: SLOT_Y,
      duration: Math.max(
        600,
        FALL_DURATION_BASE - this.currentIndex * FALL_DURATION_STEP
      ),
      ease: 'Linear',
      onComplete: () => {
        this.checkLanding()
      },
    })
  }

  // ===== 检查落地 =====
  private checkLanding() {
    this.isDropping = false

    if (!this.currentPiece) return

    // 找最近的卡槽
    let nearestSlotIdx = -1
    let minDist = 9999
    this.level.slots.forEach((slot: any, i: number) => {
      const d = Math.abs(slot.x - this.pieceX)
      if (d < minDist) {
        minDist = d
        nearestSlotIdx = i
      }
    })

    const targetSlot = this.level.slots[nearestSlotIdx]
    const currentShapeId = this.level.sequence[this.currentIndex]
    const shapeMatches = targetSlot.shapeIds.includes(currentShapeId)
    const isCorrect = minDist < 80 && shapeMatches
    if (isCorrect) {
      // 成功！
      this.combo += 1

      // ★ 按"该槽已叠数量"决定"叠上去"的高度
      const slotId = targetSlot.id
      const stackH = this.stackHeight.get(slotId) ?? 0
      const stackOffsetY = stackH * 28 // 每层错开 28px

      this.currentPiece.x = targetSlot.x
      this.currentPiece.y = SLOT_Y - stackOffsetY
      this.currentPiece.setScale(1 - stackH * 0.05) // 越往上越小一点
      this.currentPiece.setDepth(1100 + stackH)

      this.stackHeight.set(slotId, stackH + 1)

      // 移除影子
      const shadow = this.currentPiece.list[0] as Phaser.GameObjects.Graphics
      if (shadow) shadow.destroy()

      // 落对时"弹一下"
      this.tweens.add({
        targets: this.currentPiece,
        scaleY: this.currentPiece.scaleY * 0.85,
        duration: 100,
        yoyo: true,
      })

      const glow = this.add.circle(targetSlot.x, SLOT_Y - stackOffsetY, 50, 0xd4a338, 0.6).setDepth(400)
      this.tweens.add({
        targets: glow,
        scale: 1.5,
        alpha: 0,
        duration: 500,
        onComplete: () => glow.destroy(),
      })

      this.showToast(this.combo > 1 ? `叠罗汉 x${this.combo}！` : '落对了')

      this.currentIndex += 1
      this.refreshHud()

      this.currentPiece = null as any

      this.time.delayedCall(400, () => this.spawnNextPiece())
    } else {
      // 失败
      this.combo = 0
      this.refreshHud()
      this.showToast('形状或位置不对，重置')

      // 抖动 + 销毁
      this.tweens.add({
        targets: this.currentPiece,
        x: this.pieceX + 10,
        duration: 50,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          this.currentPiece.destroy()
          this.currentPiece = null as any
          // 失败不增加 currentIndex，立即重新生成同一个
          this.time.delayedCall(300, () => this.spawnNextPiece())
        },
      })
    }
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
    // ★ 完美判定：全程连击不断（combo === 总落榫数）即完美
    const isPerfect = this.combo >= this.level.sequence.length

    LevelProgress.markCompleted(this.level.id)
    const reward = CoinSystem.rewardLevel(this.level.id, isPerfect)
    CoinSystem.showFloatText(this, reward)

    // ★ 金币轻提示（reward > 0 时在面板下方飘一下）
    if (reward > 0) {
      const coinTip = this.add
        .text(640, 400, `🪙 获得金币 +${reward}${isPerfect ? '（完美）' : ''}`, {
          fontFamily: UI_FONT,
          fontSize: '20px',
          color: '#b8860b',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(5002)
        .setAlpha(0)
      this.tweens.add({
        targets: coinTip,
        alpha: 1,
        y: 390,
        duration: 260,
        yoyo: true,
        hold: 1200,
        onComplete: () => coinTip.destroy(),
      })
    }

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

  // 完成
  private completeLevel() {
    if (this.completed) return
    this.completed = true
    this.time.delayedCall(500, () => this.showKnowledgeCard())
  }
}