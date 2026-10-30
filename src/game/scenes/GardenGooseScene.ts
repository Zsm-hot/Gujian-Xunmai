import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { paintGarden } from '../world/paintGarden.ts'
import { gardenGooseLevel } from '../data/levels/garden-goose.ts'
import { isoToScreen } from '../iso.ts'
import type { GooseLevelConfig } from '../types.ts'
import { CoinSystem } from '../systems/CoinSystem.ts'

export class GardenGooseScene extends Phaser.Scene {
  private level!: GooseLevelConfig
  private overlayOpen = false
  private dialogueIndex = 0
  private currentStep = 1
  private toolCards: Map<string, Phaser.GameObjects.Container> = new Map()
  private gooseRef!: Phaser.GameObjects.Text
  private gooseGlowRef!: Phaser.GameObjects.Arc
  private stepTextRef!: Phaser.GameObjects.Text
  private cleanBarRef!: Phaser.GameObjects.Graphics
  private completed = false


  constructor() {
    super('GardenGooseScene')
  }

  create() {
    this.level = gardenGooseLevel
    this.overlayOpen = false
    this.dialogueIndex = 0
    this.currentStep = 1
    this.completed = false
    this.toolCards = new Map()


    // 背景
    paintGarden(this)

    // UI 面板
    const uiBg = this.add.graphics().setDepth(900)
    uiBg.fillStyle(palette.paper, 0.5)
    uiBg.fillRoundedRect(160, 140, 960, 500, 20)
    uiBg.lineStyle(2, palette.gold, 0.5)
    uiBg.strokeRoundedRect(160, 140, 960, 500, 20)

    this.add
      .text(640, 168, '· 水 岸 清 羽 ·', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#8d7164',
      })
      .setOrigin(0.5)
      .setDepth(901)

    // NPC
    this.createNpc()

    // 白鹅
    this.createGoose()

    // 底部工具
    this.createToolCards()

    // HUD
    this.buildHud()

    this.refreshStepUI()
    this.drawCleanBar()

    // ★ 全局 drag / dragend 监听（判定"拖到鹅身上"）
    this.input.on(
      'drag',
      (pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
        if (this.overlayOpen) return
        const container = obj as Phaser.GameObjects.Container
        if (!container.getData || !container.getData('toolId')) return

        const goosePos = isoToScreen(this.level.goosePosition.tx, this.level.goosePosition.ty)
        const dist = Math.hypot(pointer.x - goosePos.x, pointer.y - goosePos.y)
        if (dist < 120) {
          this.gooseRef.setScale(1.15)
          this.gooseGlowRef.setAlpha(0.5)
        } else {
          this.gooseRef.setScale(1)
          this.gooseGlowRef.setAlpha(0.25)
        }
      },
    )

    this.input.on(
      'dragend',
      (pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
        if (this.overlayOpen) return
        const container = obj as Phaser.GameObjects.Container
        const toolId = container.getData ? (container.getData('toolId') as string | undefined) : undefined
        if (!toolId) return

        this.gooseRef.setScale(1)
        this.gooseGlowRef.setAlpha(0.25)

        const goosePos = isoToScreen(this.level.goosePosition.tx, this.level.goosePosition.ty)
        const dist = Math.hypot(pointer.x - goosePos.x, pointer.y - goosePos.y)

        if (dist < 120) {
          this.executeStepWithTool(toolId)
        } else {
          this.showToast('把工具拖到白鹅身上')
        }
      },
    )
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

    const face = this.add.text(0, -20, '👴', { fontSize: '32px' }).setOrigin(0.5)
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

  // ===== 白鹅 =====
  private createGoose() {
    const pos = isoToScreen(this.level.goosePosition.tx, this.level.goosePosition.ty)

    // 灰圈（初始"脏"）
    this.gooseGlowRef = this.add.circle(pos.x, pos.y, 70, 0x8a8272, 0.25).setDepth(800)
    this.gooseGlowRef.setStrokeStyle(2, 0x6a6258, 0.6)

    // 白鹅 emoji（初始"暗"）
    this.gooseRef = this.add
      .text(pos.x, pos.y, '🦢', { fontSize: '80px' })
      .setOrigin(0.5)
      .setDepth(1500)
      .setAlpha(0.7)

    // 脏点
    const dirt = this.add.container(pos.x, pos.y).setDepth(1501)
    for (let i = 0; i < 5; i += 1) {
      const dx = (Math.random() - 0.5) * 55
      const dy = (Math.random() - 0.5) * 45
      const dot = this.add.circle(dx, dy, 4, 0x6a5a3a, 0.6)
      dirt.add(dot)
    }
    this.gooseRef.setData('dirt', dirt)
  }

  // ===== 工具卡片（可拖拽）=====
  private createToolCards() {
    const cardW = 110
    const cardH = 100
    const gap = 20
    const totalW = this.level.tools.length * cardW + (this.level.tools.length - 1) * gap
    const startX = 640 - totalW / 2 + cardW / 2
    const y = 640

    this.level.tools.forEach((tool, i) => {
      const x = startX + i * (cardW + gap)
      const card = this.createToolCard(tool.id, tool.icon, tool.name, x, y, cardW, cardH)
      this.toolCards.set(tool.id, card)
    })
  }

  private createToolCard(
    id: string,
    icon: string,
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ): Phaser.GameObjects.Container {
    const root = this.add.container(x, y).setDepth(2500)

    const bg = this.add.graphics()
    bg.fillStyle(palette.panel, 0.96)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10)
    bg.lineStyle(2, palette.gold, 0.8)
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10)
    root.add(bg)

    const iconText = this.add.text(0, -10, icon, { fontSize: '36px' }).setOrigin(0.5)
    root.add(iconText)

    const nameText = this.add
      .text(0, 28, name, {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#4a453f',
      })
      .setOrigin(0.5)
    root.add(nameText)

    root.setSize(w, h)
    root.setInteractive({ useHandCursor: true })

    root.setData('toolId', id)
    root.setData('homeX', x)
    root.setData('homeY', y)

    // ★ 启用原生拖拽
    this.input.setDraggable(root)

    root.on('dragstart', () => {
      if (this.overlayOpen) return
      root.setDepth(3500)
      root.setScale(1.1)
    })

    root.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      root.setPosition(dragX, dragY)
    })

    root.on('dragend', () => {
      root.setScale(1)
      root.setDepth(2500)
      // 回原位
      this.tweens.add({
        targets: root,
        x: root.getData('homeX') as number,
        y: root.getData('homeY') as number,
        duration: 300,
        ease: 'Back.easeOut',
      })
    })

    return root
  }

  // ===== 用指定工具执行"当前步骤" =====
  private executeStepWithTool(toolId: string) {
    const tool = this.level.tools.find((t) => t.id === toolId)
    if (!tool) return

    if (tool.stepIndex === this.currentStep) {
      // 正确
      this.showToast(`${tool.name} · 完成`)
      this.updateGooseCleanliness()

      this.currentStep += 1
      this.refreshStepUI()
      this.drawCleanBar()

      if (this.currentStep > this.level.tools.length) {
        this.completeLevel()
      }
      return
    }

    // 顺序错
    if (tool.stepIndex < this.currentStep) {
      this.showToast(`「${tool.name}」已经用过啦`)
    } else {
      const correctTool = this.level.tools.find((t) => t.stepIndex === this.currentStep)
      if (correctTool) {
        this.showToast(`顺序不对——应先「${correctTool.name}」`)
      }
    }
  }

  // ===== 更新"鹅的状态" =====
  private updateGooseCleanliness() {
    const progress = this.currentStep / this.level.tools.length
    const newAlpha = 0.7 + progress * 0.3
    this.tweens.add({
      targets: this.gooseRef,
      alpha: newAlpha,
      duration: 400,
    })

    const dirt = this.gooseRef.getData('dirt') as Phaser.GameObjects.Container | undefined
    if (dirt) {
      const dots = dirt.list as Phaser.GameObjects.Arc[]
      if (dots.length > 0) {
        const dot = dots[dots.length - 1]
        this.tweens.add({
          targets: dot,
          alpha: 0,
          duration: 300,
          onComplete: () => dot.destroy(),
        })
      }
    }

    // 鹅"抖一下"
    this.tweens.add({
      targets: this.gooseRef,
      angle: 5,
      duration: 150,
      yoyo: true,
    })
  }

  // ===== 当前步骤 UI =====
  private refreshStepUI() {
    if (!this.stepTextRef) {
      this.stepTextRef = this.add
        .text(640, 200, '', {
          fontFamily: UI_FONT,
          fontSize: '16px',
          color: '#4a453f',
          backgroundColor: '#efe6d8ee',
          padding: { x: 12, y: 6 },
        })
        .setOrigin(0.5)
        .setDepth(2001)
    }

    const tool = this.level.tools.find((t) => t.stepIndex === this.currentStep)
    if (tool) {
      this.stepTextRef.setText(
        `当前步骤 ${this.currentStep} / ${this.level.tools.length} · 把「${tool.name}」拖到白鹅身上`,
      )
    } else {
      this.stepTextRef.setText('全部完成！')
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
      .text(1230, 38, '拖动工具 → 放到白鹅身上 · 按顺序', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#efe6d8',
      })
      .setOrigin(1, 0)
      .setDepth(2001)
      .setAlpha(0.85)

    this.cleanBarRef = this.add.graphics().setDepth(2001)
  }

  private drawCleanBar() {
    if (!this.cleanBarRef) return
    const bar = this.cleanBarRef
    bar.clear()

    const x = 1100
    const y = 100
    const W = 140
    const H = 16

    bar.fillStyle(0x2a3038, 0.9)
    bar.fillRect(x - W / 2 - 2, y - H / 2 - 2, W + 4, H + 4)
    bar.lineStyle(2, palette.gold, 0.9)
    bar.strokeRect(x - W / 2 - 2, y - H / 2 - 2, W + 4, H + 4)

    const progress = Math.min(1, (this.currentStep - 1) / this.level.tools.length)
    if (progress > 0) {
      bar.fillStyle(0x7ac88a, 0.95)
      bar.fillRect(x - W / 2, y - H / 2, W * progress, H)
    }

    const existing = this.children.getByName('clean-label')
    if (existing) existing.destroy()
    this.add
      .text(x, y - 22, `洁净度 ${Math.round(progress * 100)}%`, {
        fontFamily: UI_FONT,
        fontSize: '12px',
        color: '#4a453f',
      })
      .setOrigin(0.5)
      .setDepth(2001)
      .setName('clean-label')
  }

  private completeLevel() {
    if (this.completed) return
    this.completed = true

    this.tweens.add({
      targets: this.gooseRef,
      scale: 1.2,
      duration: 400,
      yoyo: true,
    })

    this.time.delayedCall(800, () => this.showKnowledgeCard())
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
    const isPerfect = true // 如果有关卡失误记录，替换成对应的变量
    const reward = CoinSystem.rewardLevel(this.level.id, isPerfect)
    CoinSystem.showFloatText(this, reward)
    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'suzhou-garden' })
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