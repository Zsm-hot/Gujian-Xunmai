import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { paintGarden } from '../world/paintGarden.ts'
import { gardenFishLevel } from '../data/levels/garden-fish.ts'
import { isoToScreen } from '../iso.ts'
import type { FishLevelConfig } from '../types.ts'
import { CoinSystem } from '../systems/CoinSystem.ts'

/** 池区投喂状态 */
type ZoneState = {
  feedCount: number      // 当前投喂量
  hasBadFood: boolean    // 是否投喂过"面包"
}

export class GardenFishScene extends Phaser.Scene {
  private level!: FishLevelConfig
  private overlayOpen = false
  private dialogueIndex = 0
  private zoneStates: Map<string, ZoneState> = new Map()
  private waterBarRefs: Map<string, Phaser.GameObjects.Graphics> = new Map()
  private zoneLabelRefs: Map<string, Phaser.GameObjects.Text> = new Map()
  private zoneIconsRefs: Map<string, Phaser.GameObjects.Text> = new Map()
  private foodCards: Map<string, Phaser.GameObjects.Container> = new Map()
  private draggingFoodId: string | null = null
  private dragStartX = 0
  private dragStartY = 0
  private isDragging = false
  private readonly DRAG_THRESHOLD = 6
  private solved = false

  constructor() {
    super('GardenFishScene')
  }

  create() {
    this.level = gardenFishLevel

    this.overlayOpen = false
    this.dialogueIndex = 0
    this.solved = false
    this.zoneStates = new Map()
    this.waterBarRefs = new Map()
    this.zoneLabelRefs = new Map()
    this.zoneIconsRefs = new Map()
    this.foodCards = new Map()

    // 初始化池区状态
    for (const z of this.level.zones) {
      this.zoneStates.set(z.id, { feedCount: 0, hasBadFood: false })
    }

    // 背景
    paintGarden(this)

    // UI 面板
    const uiBg = this.add.graphics().setDepth(900)
      uiBg.fillStyle(palette.paper, 0.5)
    uiBg.fillRoundedRect(160, 140, 960, 500, 20)
    uiBg.lineStyle(2, palette.gold, 0.5)
    uiBg.strokeRoundedRect(160, 140, 960, 500, 20)

    this.add
      .text(640, 168, '· 池 畔 逐 影 ·', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#8d7164',
      })
      .setOrigin(0.5)
      .setDepth(901)

    // NPC
    this.createNpc()

    // 绘制"3 个锦鲤池区"——半透明高亮圈
    for (const zone of this.level.zones) {
      this.createZone(zone)
    }

    // 底部：3 个"鱼食卡片"
    this.createFoodCards()

    this.buildHud()

    // 全局监听
    this.input.on('pointermove', this.onPointerMove, this)
    this.input.on('pointerup', this.onPointerUp, this)
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

  // ===== 池区（半透明高亮 + 水质条）=====
  private createZone(zone: { id: string; name: string; tx: number; ty: number }) {
    const pos = isoToScreen(zone.tx, zone.ty)

    // 半透明池区光圈（加深）
    const circle = this.add
      .circle(pos.x, pos.y, 60, 0x3a6070, 0.35)   // 深蓝绿 + 0.35
      .setDepth(1100)
    circle.setStrokeStyle(3, 0x2a4858, 0.9)        // 深边框，粗一点

    // 池区里"锦鲤"图标（加大）
    const fish = this.add
      .text(pos.x, pos.y - 6, '🐟', { fontSize: '32px' })
      .setOrigin(0.5)
      .setDepth(1110)
    this.zoneIconsRefs.set(zone.id, fish)

     // 池区名 + 数量（更醒目）
    const label = this.add
      .text(pos.x, pos.y + 38, `${zone.name} · 0 份`, {
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#2a4858ee',       // 深底白字
        padding: { x: 10, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(1120)
    this.zoneLabelRefs.set(zone.id, label)

    // 水质条（池区上方 40px）
    const bar = this.add.graphics().setDepth(1130)
    this.waterBarRefs.set(zone.id, bar)
      this.drawWaterBar(zone.id, pos.x, pos.y - 75)
  }

  // ===== 绘制"水质条" =====
  private drawWaterBar(zoneId: string, x: number, y: number) {
    const bar = this.waterBarRefs.get(zoneId)
    if (!bar) return
    bar.clear()

    const zone = this.level.zones.find((z) => z.id === zoneId)
    if (!zone) return

    const state = this.zoneStates.get(zoneId)
    if (!state) return

     const W = 120      // 加宽
    const H = 14       // 加高

    // 外框（更醒目）
    bar.fillStyle(0x2a3038, 0.9)      // 深色底
    bar.fillRect(x - W / 2 - 2, y - H / 2 - 2, W + 4, H + 4)
    bar.lineStyle(2, palette.gold, 0.9)
    bar.strokeRect(x - W / 2 - 2, y - H / 2 - 2, W + 4, H + 4)

    // 内部填充（颜色根据状态）
    let color = 0x7ea8b8   // 蓝——"不够"
    let fillW = 0

    if (state.hasBadFood) {
      // 投了面包 —— 红色污染
      color = 0xd04848
      fillW = W
    } else if (state.feedCount === 0) {
      // 没投喂 —— 蓝——"不够"
      color = 0x7ea8b8
      fillW = 0
    } else if (state.feedCount < zone.minFeed) {
      // 太少 —— 蓝
      color = 0x7ea8b8
      fillW = (state.feedCount / zone.maxFeed) * W
    } else if (state.feedCount > zone.maxFeed) {
      // 太多 —— 红
      color = 0xd04848
      fillW = W
    } else {
      // 合适 —— 绿
      color = 0x5a9a4a
      fillW = (state.feedCount / zone.maxFeed) * W
    }

    bar.fillStyle(color, 0.9)
    bar.fillRect(x - W / 2 + 2, y - H / 2 + 2, fillW - 4, H - 4)
  }

  // ===== 底部"鱼食卡片" =====
  private createFoodCards() {
    const cardW = 120
    const cardH = 110
    const gap = 30
    const totalW = this.level.foods.length * cardW + (this.level.foods.length - 1) * gap
    const startX = 640 - totalW / 2 + cardW / 2
    const y = 640

    this.level.foods.forEach((food, i) => {
      const x = startX + i * (cardW + gap)
      const card = this.createFoodCard(food.id, food.icon, food.name, food.valid, x, y, cardW, cardH)
      this.foodCards.set(food.id, card)
    })
  }

  private createFoodCard(
    id: string,
    icon: string,
    name: string,
    _valid: boolean,
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

    const iconText = this.add
      .text(0, -14, icon, { fontSize: '38px' })
      .setOrigin(0.5)
    root.add(iconText)

    const nameText = this.add
      .text(0, 28, name, {
        fontFamily: UI_FONT,
        fontSize: '16px',
        color: '#4a453f',
      })
      .setOrigin(0.5)
    root.add(nameText)

    root.setSize(w, h)
    root.setInteractive({ useHandCursor: true })

    root.setData('homeX', x)
    root.setData('homeY', y)
    root.setData('foodId', id)

    root.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.overlayOpen) return
      this.draggingFoodId = id
      this.isDragging = false
      this.dragStartX = pointer.x
      this.dragStartY = pointer.y
      root.setDepth(3500)
    })

    return root
  }

  // ===== 拖拽逻辑（全局 pointermove / pointerup）=====
  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.draggingFoodId) return

    if (!this.isDragging) {
      const dx = pointer.x - this.dragStartX
      const dy = pointer.y - this.dragStartY
      if (Math.hypot(dx, dy) < this.DRAG_THRESHOLD) return
      this.isDragging = true
      const card = this.foodCards.get(this.draggingFoodId)
      if (card) card.setScale(1.08)
    }

    const card = this.foodCards.get(this.draggingFoodId)
    if (card) card.setPosition(pointer.x, pointer.y)
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.draggingFoodId) return

    const foodId = this.draggingFoodId
    const card = this.foodCards.get(foodId)
    this.draggingFoodId = null
    const wasDragging = this.isDragging
    this.isDragging = false

    if (!card) return
    card.setScale(1)

    if (!wasDragging) {
      // 没拖动 —— 点了一下，回位
      this.returnCardHome(card)
      return
    }

    // 找最近的池区
    const nearestZone = this.findNearestZone(pointer.x, pointer.y)
    if (!nearestZone) {
      this.returnCardHome(card)
      return
    }

    // 投喂！
    this.feedZone(nearestZone.id, foodId)
    this.returnCardHome(card)
  }

  private findNearestZone(x: number, y: number): { id: string } | null {
    let best: { id: string; dist: number } | null = null
    for (const zone of this.level.zones) {
      const pos = isoToScreen(zone.tx, zone.ty)
      const d = Math.hypot(pos.x - x, pos.y - y)
      if (d < 90) {
        if (!best || d < best.dist) {
          best = { id: zone.id, dist: d }
        }
      }
    }
    return best ? { id: best.id } : null
  }

  private returnCardHome(card: Phaser.GameObjects.Container) {
    card.setDepth(2500)
    this.tweens.add({
      targets: card,
      x: card.getData('homeX'),
      y: card.getData('homeY'),
      duration: 260,
      ease: 'Back.easeOut',
    })
  }

  // ===== 投喂 =====
  private feedZone(zoneId: string, foodId: string) {
    const food = this.level.foods.find((f) => f.id === foodId)
    const zone = this.level.zones.find((z) => z.id === zoneId)
    const state = this.zoneStates.get(zoneId)
    if (!food || !zone || !state) return

    // 不合格鱼食 → 直接污染
    if (!food.valid) {
      state.hasBadFood = true
      this.showToast(`${zone.name}被"${food.name}"污染了！`)
      this.floatTextOnZone(zoneId, '💀')
      this.refreshZoneUI(zoneId)
      return
    }

    // 已污染 —— 不能再喂
    if (state.hasBadFood) {
      this.showToast(`${zone.name}已污染，无法投喂`)
      return
    }

    state.feedCount += 1
    this.floatTextOnZone(zoneId, '+1')

    // 反馈
    this.refreshZoneUI(zoneId)
    this.checkAllZones()

    // 卡片飘动
    const card = this.foodCards.get(foodId)
    if (card) {
      card.setScale(0.95)
      this.tweens.add({
        targets: card,
        scale: 1,
        duration: 200,
      })
    }
  }

  private floatTextOnZone(zoneId: string, text: string) {
    const zone = this.level.zones.find((z) => z.id === zoneId)
    if (!zone) return
    const pos = isoToScreen(zone.tx, zone.ty)

    const t = this.add
      .text(pos.x, pos.y - 20, text, {
        fontFamily: UI_FONT,
        fontSize: '20px',
        color: '#4a453f',
        backgroundColor: '#efe6d8ee',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(4000)
      .setAlpha(0)

    this.tweens.add({
      targets: t,
      alpha: 1,
      y: pos.y - 60,
      duration: 500,
      onComplete: () => {
        this.tweens.add({
          targets: t,
          alpha: 0,
          duration: 400,
          onComplete: () => t.destroy(),
        })
      },
    })
  }

  private refreshZoneUI(zoneId: string) {
    const zone = this.level.zones.find((z) => z.id === zoneId)
    const state = this.zoneStates.get(zoneId)
    const label = this.zoneLabelRefs.get(zoneId)
    const icon = this.zoneIconsRefs.get(zoneId)
    if (!zone || !state || !label) return

    // 更新 label 文本
    let status = ''
    if (state.hasBadFood) {
      status = '污染'
    } else if (state.feedCount >= zone.minFeed && state.feedCount <= zone.maxFeed) {
      status = '合适'
    } else if (state.feedCount === 0) {
      status = '未喂'
    } else if (state.feedCount < zone.minFeed) {
      status = '不足'
    } else {
      status = '过量'
    }
    label.setText(`${zone.name} · ${state.feedCount} 份 · ${status}`)

    // 更新水质条
    const pos = isoToScreen(zone.tx, zone.ty)
    this.drawWaterBar(zoneId, pos.x, pos.y - 75)

    // 更新锦鲤图标（污染→💀）
    if (icon) {
      if (state.hasBadFood) {
        icon.setText('💀')
      } else if (state.feedCount >= zone.minFeed && state.feedCount <= zone.maxFeed) {
        icon.setText('🐟')
      } else {
        icon.setText('🐠')
      }
    }
  }

  private checkAllZones() {
    if (this.solved) return

    let allOk = true
    for (const zone of this.level.zones) {
      const state = this.zoneStates.get(zone.id)
      if (!state) {
        allOk = false
        break
      }
      if (state.hasBadFood) {
        allOk = false
        break
      }
      if (state.feedCount < zone.minFeed || state.feedCount > zone.maxFeed) {
        allOk = false
        break
      }
    }

    if (allOk) {
      this.solved = true
      this.showToast('三区皆得其食！')
      this.time.delayedCall(1200, () => this.showKnowledgeCard())
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
      .text(1230, 38, '拖动下方鱼食 → 放到池区 · 每区适量', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#efe6d8',
      })
      .setOrigin(1, 0)
      .setDepth(2001)
      .setAlpha(0.85)
          // ★ 加"重来"按钮在这里 ↓
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

  // ===== 知识卡 =====
  private showKnowledgeCard() {
    if (this.overlayOpen) return
    this.overlayOpen = true

    showKnowledgeCard(this, this.level.knowledgeCard, () => {
      this.showAzhuComment()
    })
  }

  // ===== 阿筑短评 =====
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

  // ===== 成功面板 =====
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
   const isPerfect = true // 如果有具体的失误变量，比如 this.mistakes === 0 请替换
    const reward = CoinSystem.rewardLevel(this.level.id, isPerfect)
    CoinSystem.showFloatText(this, reward)
    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'suzhou-garden' })
    }).setDepth(5002)
  }

  // ===== Toast =====
  private showToast(msg: string) {
    const t = this.add
      .text(640, 120, msg, {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: '#4a453f',
        backgroundColor: '#efe6d8ee',
        padding: { x: 16, y: 10 },
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