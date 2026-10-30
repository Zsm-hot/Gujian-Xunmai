import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { paintGarden } from '../world/paintGarden.ts'
import { gardenWellLevel } from '../data/levels/garden-well.ts'
import { isoToScreen } from '../iso.ts'
import type { WellLevelConfig } from '../types.ts'
import { worlds } from '../data/worlds.ts' // 🌟 新增
import { showCatPostcard } from '../ui/CatPostcardUI.ts' // 🌟 新增
import { CoinSystem } from '../systems/CoinSystem.ts'

type Stage = 1 | 2 | 3 | 4

export class GardenWellScene extends Phaser.Scene {
  private level!: WellLevelConfig
  private overlayOpen = false
  private dialogueIndex = 0
  private stageTextRef!: Phaser.GameObjects.Text
  private completed = false
  private stageLayer!: Phaser.GameObjects.Container

  // 阶段 1
  private debrisCleared: Set<string> = new Set()
  private debrisNodes: Map<string, Phaser.GameObjects.Container> = new Map()

  // 阶段 2
  private pipesFiltered: Set<string> = new Set()
  private pipeNodes: Map<string, Phaser.GameObjects.Container> = new Map()

  // 阶段 3
  private waterAllocated: Map<string, number> = new Map()
  private targetNodes: Map<string, Phaser.GameObjects.Container> = new Map()
  private draggingKnob: {
    targetId: string
    knob: Phaser.GameObjects.Container
    knobText: Phaser.GameObjects.Text
    trackX: number
    trackW: number
    maxVal: number
    pointerStartX: number
    knobStartX: number
  } | null = null

  // 阶段 4
  private coverPlaced: Set<string> = new Set()
  private coverPieces: Map<string, Phaser.GameObjects.Container> = new Map()
  private draggingPieceId: string | null = null

  constructor() {
    super('GardenWellScene')
  }

  create() {
    this.level = gardenWellLevel
    this.overlayOpen = false
    this.dialogueIndex = 0
    this.completed = false

    this.debrisCleared = new Set()
    this.debrisNodes = new Map()
    this.pipesFiltered = new Set()
    this.pipeNodes = new Map()
    this.waterAllocated = new Map()
    this.targetNodes = new Map()
    this.draggingKnob = null
    this.coverPlaced = new Set()
    this.coverPieces = new Map()
    this.draggingPieceId = null

    // 背景
    paintGarden(this)

    // 画井
    this.paintWell()

    // UI 面板
    const uiBg = this.add.graphics().setDepth(900)
    uiBg.fillStyle(palette.paper, 0.5)
    uiBg.fillRoundedRect(160, 140, 960, 500, 20)
    uiBg.lineStyle(2, palette.gold, 0.5)
    uiBg.strokeRoundedRect(160, 140, 960, 500, 20)

    this.add
      .text(640, 168, '· 天 井 通 渠 ·', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#8d7164',
      })
      .setOrigin(0.5)
      .setDepth(901)

    // NPC
    this.createNpc()

    // 阶段层
    this.stageLayer = this.add.container(0, 0).setDepth(1500)

    // HUD
    this.buildHud()

    // 全局 drag（滤网）
    this.input.on(
      'drag',
      (pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
        if (this.overlayOpen) return
        const container = obj as Phaser.GameObjects.Container
        if (!container.getData || !container.getData('isFilter')) return

        const nearest = this.findNearestPipe(pointer.x, pointer.y)
        for (const [pid, node] of this.pipeNodes) {
          const glow = node.getData('glow') as Phaser.GameObjects.Arc | undefined
          if (glow) {
            glow.setAlpha(nearest && nearest.id === pid ? 0.5 : 0.15)
          }
        }
      },
    )

    this.input.on(
      'dragend',
      (pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
        if (this.overlayOpen) return
        const container = obj as Phaser.GameObjects.Container
        if (!container.getData || !container.getData('isFilter')) return

        for (const [, node] of this.pipeNodes) {
          const glow = node.getData('glow') as Phaser.GameObjects.Arc | undefined
          if (glow) glow.setAlpha(0.15)
        }

        const nearest = this.findNearestPipe(pointer.x, pointer.y)
        if (nearest) {
          this.filterPipe(nearest.id)
        } else {
          this.showToast('把滤网拖到水管口')
        }

        this.tweens.add({
          targets: container,
          x: container.getData('homeX') as number,
          y: container.getData('homeY') as number,
          duration: 300,
          ease: 'Back.easeOut',
        })
      },
    )

    // 全局 pointermove / pointerup（滑块）
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // 滑块拖拽
      if (this.draggingKnob) {
        const d = this.draggingKnob
        const dx = pointer.x - d.pointerStartX
        const newX = d.knobStartX + dx
        const clamped = Phaser.Math.Clamp(newX, -d.trackW / 2, d.trackW / 2)
        d.knob.x = clamped

        const val = Math.round(((clamped + d.trackW / 2) / d.trackW) * d.maxVal)
        d.knobText.setText(String(val))
        this.waterAllocated.set(d.targetId, val)
        this.refreshTargetVisual(d.targetId)
      }

      // 井盖碎片拖拽
      if (this.draggingPieceId) {
        const piece = this.coverPieces.get(this.draggingPieceId)
        if (piece) {
          piece.setPosition(pointer.x, pointer.y)
        }
      }
    })

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      // 滑块结束
      if (this.draggingKnob) {
        const d = this.draggingKnob
        this.draggingKnob = null

        this.checkAllTargetsSatisfied()

        const val = this.waterAllocated.get(d.targetId) ?? 0
        const target = this.level.targets.find((t) => t.id === d.targetId)
        if (target) {
          if (val >= target.needMin && val <= target.needMax) {
            this.showToast(`${target.name} · 水量合适（${val}）`)
          } else {
            this.showToast(`${target.name} · 需要 ${target.needMin}~${target.needMax} 份`)
          }
        }
      }

      // 碎片结束
      if (this.draggingPieceId) {
        const pieceId = this.draggingPieceId
        const piece = this.coverPieces.get(pieceId)
        this.draggingPieceId = null

        if (piece) {
          // 找最近槽位
          const nearest = this.findNearestCoverSlot(pointer.x, pointer.y)
          const correctSlotId = this.level.coverPieces.find((p) => p.id === pieceId)?.slotId

          if (nearest && nearest.id === correctSlotId) {
            // 放对
            piece.setPosition(nearest.x, nearest.y)
            piece.setData('locked', true)
            this.coverPlaced.add(pieceId)
            this.showToast('井盖碎片归位')
            this.checkAllCoverPlaced()
          } else {
            // 回位
            this.tweens.add({
              targets: piece,
              x: piece.getData('homeX') as number,
              y: piece.getData('homeY') as number,
              duration: 300,
              ease: 'Back.easeOut',
            })
            if (nearest) {
              this.showToast('这块不合')
            }
          }
        }
      }
    })

    this.startStage(1)
  }

  // ===== 画井 =====
  private paintWell() {
    const pos = isoToScreen(this.level.wellPosition.tx, this.level.wellPosition.ty)
    const g = this.add.graphics().setDepth(700)

    g.fillStyle(0x4a5a60, 0.25)
    g.fillEllipse(pos.x + 6, pos.y + 14, 130, 50)

    g.fillStyle(0xc8c0b0, 1)
    g.fillEllipse(pos.x, pos.y, 130, 50)
    g.lineStyle(2, 0x8a8272, 0.7)
    g.strokeEllipse(pos.x, pos.y, 130, 50)

    g.fillStyle(0xa8a090, 1)
    g.fillEllipse(pos.x, pos.y - 4, 110, 40)

    g.fillStyle(0x2a2520, 1)
    g.fillEllipse(pos.x, pos.y - 6, 90, 32)

    g.fillStyle(0x3a5868, 1)
    g.fillEllipse(pos.x, pos.y - 6, 75, 26)
    g.fillStyle(0x6a8898, 0.5)
    g.fillEllipse(pos.x - 15, pos.y - 10, 30, 8)

    g.lineStyle(6, 0x8a5a3a, 1)
    g.beginPath()
    g.arc(pos.x, pos.y + 2, 60, 0, Math.PI, false)
    g.strokePath()
    g.lineStyle(4, 0x5a3a24, 0.8)
    g.beginPath()
    g.arc(pos.x, pos.y - 2, 60, Math.PI, Math.PI * 2, false)
    g.strokePath()

    g.fillStyle(0x6a4a24, 1)
    g.fillRect(pos.x - 55, pos.y - 70, 6, 70)
    g.fillRect(pos.x + 49, pos.y - 70, 6, 70)
    g.fillRect(pos.x - 55, pos.y - 70, 110, 6)

    g.lineStyle(1.5, 0xc8a870, 0.9)
    g.beginPath()
    g.moveTo(pos.x, pos.y - 64)
    g.lineTo(pos.x, pos.y - 20)
    g.strokePath()

    g.fillStyle(0x8a5a3a, 1)
    g.fillRect(pos.x - 5, pos.y - 20, 10, 8)

    this.add
      .text(pos.x, pos.y + 30, '古井', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#4a453f',
        backgroundColor: '#efe6d8dd',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(710)
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

    this.stageTextRef = this.add
      .text(640, 200, '', {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: '#4a453f',
        backgroundColor: '#efe6d8ee',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(2001)

    this.add
      .text(1230, 38, '按阶段完成 · 顺序推进', {
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

  // ===== 阶段切换 =====
  private startStage(stage: Stage) {
    this.stageLayer.removeAll(true)
    this.debrisNodes.clear()
    this.pipeNodes.clear()
    this.targetNodes.clear()
    this.coverPieces.clear()
    this.draggingKnob = null
    this.draggingPieceId = null

    const stageNames: Record<Stage, string> = {
      1: '① 清理古井',
      2: '② 滤除淤塞',
      3: '③ 分配泉水',
      4: '④ 封护井栏',
    }
    this.stageTextRef.setText(`阶段 ${stage} / 4 · ${stageNames[stage]}`)

    if (stage === 1) this.startStage1()
    else if (stage === 2) this.startStage2()
    else if (stage === 3) this.startStage3()
    else this.startStage4()
  }

  // ===== 阶段 1 =====
  private startStage1() {
    for (const d of this.level.debris) {
      if (this.debrisCleared.has(d.id)) continue

      const pos = isoToScreen(d.tx, d.ty)
      const node = this.createDebrisNode(d.id, d.icon, d.name, pos.x, pos.y)
      this.debrisNodes.set(d.id, node)
      this.stageLayer.add(node)
    }

    if (this.debrisCleared.size >= this.level.debris.length) {
      this.time.delayedCall(500, () => this.startStage(2))
    }
  }

  private createDebrisNode(
    id: string,
    icon: string,
    name: string,
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const root = this.add.container(x, y)

    const glow = this.add.circle(0, 0, 22, 0xd4a338, 0.25)
    this.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.4 },
      alpha: { from: 0.3, to: 0.05 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
    root.add(glow)

    const iconText = this.add.text(0, 0, icon, { fontSize: '32px' }).setOrigin(0.5)
    root.add(iconText)

    const label = this.add
      .text(0, 28, name, {
        fontFamily: UI_FONT,
        fontSize: '11px',
        color: '#4a453f',
        backgroundColor: '#efe6d8dd',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
    root.add(label)

    const hit = this.add
      .circle(0, 0, 30, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true })
    root.add(hit)

    hit.on('pointerup', () => {
      if (this.overlayOpen) return
      this.clearDebris(id, root)
    })

    return root
  }

  private clearDebris(id: string, node: Phaser.GameObjects.Container) {
    if (this.debrisCleared.has(id)) return

    this.debrisCleared.add(id)

    const float = this.add
      .text(node.x, node.y, '✨', { fontSize: '28px' })
      .setOrigin(0.5)
      .setDepth(4000)
    this.tweens.add({
      targets: float,
      y: node.y - 50,
      alpha: 0,
      duration: 600,
      onComplete: () => float.destroy(),
    })

    this.tweens.add({
      targets: node,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => node.destroy(),
    })

    this.showToast(`已清理「${this.level.debris.find((d) => d.id === id)?.name}」`)

    if (this.debrisCleared.size >= this.level.debris.length) {
      this.time.delayedCall(700, () => {
        this.showToast('井中杂物已清空')
        this.time.delayedCall(800, () => this.startStage(2))
      })
    }
  }

  // ===== 阶段 2 =====
  private startStage2() {
    for (const pipe of this.level.pipes) {
      if (this.pipesFiltered.has(pipe.id)) continue

      const pos = isoToScreen(pipe.tx, pipe.ty)
      const node = this.createPipeNode(pipe.id, pipe.name, pos.x, pos.y)
      this.pipeNodes.set(pipe.id, node)
      this.stageLayer.add(node)
    }

    this.createFilterCard()

    if (this.pipesFiltered.size >= this.level.pipes.length) {
      this.time.delayedCall(500, () => this.startStage(3))
    }
  }

  private createPipeNode(
    _id: string,
    name: string,
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const root = this.add.container(x, y)

    const glow = this.add.circle(0, 0, 40, 0x5a7f8e, 0.15)
    glow.setStrokeStyle(3, 0x2a4858, 0.7)
    root.add(glow)
    root.setData('glow', glow)

    const hole = this.add.circle(0, 0, 24, 0x2a2520, 0.9)
    root.add(hole)

    const water = this.add.circle(0, 0, 18, 0x3a5868, 1)
    root.add(water)

    const label = this.add
      .text(0, 50, name, {
        fontFamily: UI_FONT,
        fontSize: '13px',
        color: '#4a453f',
        backgroundColor: '#efe6d8ee',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
    root.add(label)

    const check = this.add.text(30, -30, '', { fontSize: '24px' }).setOrigin(0.5).setAlpha(0)
    root.add(check)
    root.setData('check', check)

    return root
  }

  private createFilterCard() {
    const x = 640
    const y = 660
    const w = 110
    const h = 90

    const card = this.add.container(x, y).setDepth(2500)

    const bg = this.add.graphics()
    bg.fillStyle(palette.panel, 0.96)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10)
    bg.lineStyle(2, palette.gold, 0.8)
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10)
    card.add(bg)

    const icon = this.add.text(0, -10, '🕸', { fontSize: '36px' }).setOrigin(0.5)
    card.add(icon)

    const name = this.add
      .text(0, 25, '滤网', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#4a453f',
      })
      .setOrigin(0.5)
    card.add(name)

    card.setSize(w, h)
    card.setInteractive({ useHandCursor: true })

    card.setData('isFilter', true)
    card.setData('homeX', x)
    card.setData('homeY', y)

    this.input.setDraggable(card)

    card.on('dragstart', () => {
      if (this.overlayOpen) return
      card.setDepth(3500)
      card.setScale(1.1)
    })

    card.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      card.setPosition(dragX, dragY)
    })

    card.on('dragend', () => {
      card.setScale(1)
      card.setDepth(2500)
    })
  }

  private findNearestPipe(x: number, y: number): { id: string } | null {
    let best: { id: string; dist: number } | null = null
    for (const pipe of this.level.pipes) {
      if (this.pipesFiltered.has(pipe.id)) continue
      const pos = isoToScreen(pipe.tx, pipe.ty)
      const d = Math.hypot(pos.x - x, pos.y - y)
      if (d < 100) {
        if (!best || d < best.dist) best = { id: pipe.id, dist: d }
      }
    }
    return best ? { id: best.id } : null
  }

  private filterPipe(id: string) {
    if (this.pipesFiltered.has(id)) return

    this.pipesFiltered.add(id)

    const node = this.pipeNodes.get(id)
    if (node) {
      const check = node.getData('check') as Phaser.GameObjects.Text
      if (check) {
        check.setText('✓')
        this.tweens.add({
          targets: check,
          alpha: 1,
          scale: { from: 0.3, to: 1 },
          duration: 400,
          ease: 'Back.easeOut',
        })
      }
      const glow = node.getData('glow') as Phaser.GameObjects.Arc
      if (glow) {
        this.tweens.add({ targets: glow, alpha: 0.5, duration: 300 })
        glow.setFillStyle(0x7ac88a, 0.3)
        glow.setStrokeStyle(3, 0x5a9a4a, 0.9)
      }
    }

    const pipeName = this.level.pipes.find((p) => p.id === id)?.name ?? ''
    this.showToast(`「${pipeName}」已过滤`)

    if (this.pipesFiltered.size >= this.level.pipes.length) {
      this.time.delayedCall(700, () => {
        this.showToast('淤塞已疏通')
        this.time.delayedCall(800, () => this.startStage(3))
      })
    }
  }

  // ===== 阶段 3 =====
  private startStage3() {
    for (const t of this.level.targets) {
      if (!this.waterAllocated.has(t.id)) {
        this.waterAllocated.set(t.id, 0)
      }
    }

    for (const target of this.level.targets) {
      const pos = isoToScreen(target.tx, target.ty)
      this.createTargetNode(target.id, target.icon, target.name, pos.x, pos.y)
      this.createSlider(target.id, pos.x, pos.y - 90)
    }

    if (this.allTargetsSatisfied()) {
      this.time.delayedCall(500, () => this.startStage(4))
    }
  }

  private createTargetNode(
    id: string,
    icon: string,
    name: string,
    x: number,
    y: number,
  ) {
    const root = this.add.container(x, y)
    this.stageLayer.add(root)
    this.targetNodes.set(id, root)

    const glow = this.add.circle(0, 0, 40, 0x7ea8b8, 0.2)
    glow.setStrokeStyle(3, 0x5a7f8e, 0.7)
    root.add(glow)
    root.setData('glow', glow)

    const iconText = this.add.text(0, 0, icon, { fontSize: '36px' }).setOrigin(0.5)
    root.add(iconText)

    const label = this.add
      .text(0, 45, name, {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#4a453f',
        backgroundColor: '#efe6d8ee',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
    root.add(label)

    const valueText = this.add
      .text(0, 72, '0', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#4a453f',
        backgroundColor: '#d8c8a0ee',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
    root.add(valueText)
    root.setData('valueText', valueText)
  }

  private createSlider(targetId: string, x: number, y: number) {
    const W = 120
    const H = 8
    const maxVal = 5

    const container = this.add.container(x, y)
    this.stageLayer.add(container)

    const track = this.add.graphics()
    track.fillStyle(0x2a3038, 0.5)
    track.fillRoundedRect(-W / 2 - 2, -H / 2 - 2, W + 4, H + 4, 4)
    track.fillStyle(0xd8d0c0, 0.9)
    track.fillRoundedRect(-W / 2, -H / 2, W, H, 4)
    container.add(track)

    for (let i = 0; i <= maxVal; i += 1) {
      const px = -W / 2 + (i / maxVal) * W
      const dot = this.add.circle(px, 0, 3, 0x8a8272, 0.8)
      container.add(dot)
      const num = this.add
        .text(px, 16, String(i), {
          fontFamily: UI_FONT,
          fontSize: '10px',
          color: '#7d6354',
        })
        .setOrigin(0.5)
      container.add(num)
    }

    const knob = this.add.container(-W / 2, 0)
    const knobBg = this.add.circle(0, 0, 14, 0xd4a338, 1)
    knobBg.setStrokeStyle(2, 0x6a4a24, 1)
    knob.add(knobBg)
    const knobText = this.add
      .text(0, 0, '0', {
        fontFamily: UI_FONT,
        fontSize: '12px',
        color: '#3a2a14',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
    knob.add(knobText)
    container.add(knob)

    const knobHit = this.add
      .circle(0, 0, 18, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true })
    knob.add(knobHit)

    knobHit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.overlayOpen) return
      this.draggingKnob = {
        targetId,
        knob,
        knobText,
        trackX: x,
        trackW: W,
        maxVal,
        pointerStartX: pointer.x,
        knobStartX: knob.x,
      }
    })
  }

  private refreshTargetVisual(targetId: string) {
    const target = this.level.targets.find((t) => t.id === targetId)
    const node = this.targetNodes.get(targetId)
    const val = this.waterAllocated.get(targetId) ?? 0
    if (!target || !node) return

    const glow = node.getData('glow') as Phaser.GameObjects.Arc
    const valueText = node.getData('valueText') as Phaser.GameObjects.Text
    if (valueText) {
      valueText.setText(`${val} / ${target.needMin}~${target.needMax}`)
    }

    if (val >= target.needMin && val <= target.needMax) {
      glow.setFillStyle(0x7ac88a, 0.4)
      glow.setStrokeStyle(3, 0x5a9a4a, 0.9)
    } else {
      glow.setFillStyle(0x7ea8b8, 0.2)
      glow.setStrokeStyle(3, 0x5a7f8e, 0.7)
    }
  }

  private allTargetsSatisfied(): boolean {
    for (const t of this.level.targets) {
      const v = this.waterAllocated.get(t.id) ?? 0
      if (v < t.needMin || v > t.needMax) return false
    }
    return true
  }

  private checkAllTargetsSatisfied() {
    if (this.allTargetsSatisfied()) {
      this.time.delayedCall(500, () => {
        this.showToast('水量恰到好处')
        this.time.delayedCall(800, () => this.startStage(4))
      })
    }
  }

  // ===== 阶段 4：封护井栏 =====
  private startStage4() {
    for (const slot of this.level.coverSlots) {
      const frame = this.add.graphics()
      frame.lineStyle(2, palette.stoneDeep, 0.7)
      frame.strokeRect(slot.x - 30, slot.y - 30, 60, 60)
      this.stageLayer.add(frame)

      const num = this.add
        .text(slot.x, slot.y + 38, `第${slot.id.replace('s', '')}块`, {
          fontFamily: UI_FONT,
          fontSize: '10px',
          color: '#9a8d7a',
        })
        .setOrigin(0.5)
      this.stageLayer.add(num)
    }

    const pieceColors = [0x8a8478, 0x8a8478, 0x8a8478, 0x8a8478]
    const pieceSymbols = ['◤', '◥', '◣', '◢']

    const startX = 400
    const startY = 580
    const gap = 60

    this.level.coverPieces.forEach((piece, i) => {
      const x = startX + i * (60 + gap)
      const y = startY
      const node = this.createCoverPiece(
        piece.id,
        pieceColors[i],
        pieceSymbols[i],
        x,
        y,
      )
      this.coverPieces.set(piece.id, node)
      this.stageLayer.add(node)
    })

    if (this.coverPlaced.size >= this.level.coverPieces.length) {
      this.time.delayedCall(500, () => this.completeLevel())
    }
  }

  private createCoverPiece(
    id: string,
    color: number,
    symbol: string,
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const root = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(color, 1)
    bg.fillRect(-30, -30, 60, 60)

    bg.lineStyle(1, 0x5a5448, 0.35)
    for (let i = -30; i < 30; i += 6) {
      bg.beginPath()
      bg.moveTo(i, -30)
      bg.lineTo(i + 12, 30)
      bg.strokePath()
    }

    bg.lineStyle(1.5, 0x4a4438, 0.8)
    bg.strokeRect(-28, -28, 56, 56)

    bg.lineStyle(2, 0x3a3428, 0.9)
    bg.strokeRect(-30, -30, 60, 60)

    bg.fillStyle(0x3a3428, 0.8)
    bg.fillCircle(-24, -24, 2.5)
    bg.fillCircle(24, -24, 2.5)
    bg.fillCircle(-24, 24, 2.5)
    bg.fillCircle(24, 24, 2.5)

    root.add(bg)

    const symbolText = this.add
      .text(0, 0, symbol, {
        fontFamily: UI_FONT,
        fontSize: '24px',
        color: '#efe6d8',
      })
      .setOrigin(0.5)
    root.add(symbolText)

    const hit = this.add
      .rectangle(0, 0, 60, 60, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true })
    root.add(hit)

    root.setData('pieceId', id)
    root.setData('homeX', x) // 这里把之前代码里的错别字也修正了
    root.setData('homeY', y)
    root.setData('locked', false)

    hit.on('pointerdown', () => {
      if (this.overlayOpen) return
      if (root.getData('locked')) return
      if (this.draggingPieceId) return

      this.draggingPieceId = id
      root.setDepth(3500)
      root.setScale(1.1)
    })

    return root
  }

  private findNearestCoverSlot(x: number, y: number): { id: string; x: number; y: number } | null {
    let best: { id: string; x: number; y: number; dist: number } | null = null
    for (const slot of this.level.coverSlots) {
      if (this.coverPlaced.has(slot.id)) continue
      const d = Math.hypot(slot.x - x, slot.y - y)
      if (d < 60) {
        if (!best || d < best.dist) best = { id: slot.id, x: slot.x, y: slot.y, dist: d }
      }
    }
    return best
  }

  private checkAllCoverPlaced() {
    if (this.coverPlaced.size >= this.level.coverPieces.length) {
      for (const [pieceId, node] of this.coverPieces) {
        const bg = this.add.graphics()
        bg.fillStyle(0xd4a338, 1)
        bg.fillRect(-30, -30, 60, 60)

        bg.lineStyle(1, 0xa88828, 0.5)
        for (let i = -30; i < 30; i += 6) {
          bg.beginPath()
          bg.moveTo(i, -30)
          bg.lineTo(i + 12, 30)
          bg.strokePath()
        }

        bg.lineStyle(1.5, 0xa88828, 1)
        bg.strokeRect(-28, -28, 56, 56)
        bg.lineStyle(2, 0x6a4a1a, 1)
        bg.strokeRect(-30, -30, 60, 60)

        node.add(bg)
        node.setData('pieceId', pieceId)
      }

      const cx = 460
      const cy = 458
      const glow = this.add.circle(cx, cy, 70, 0xffe080, 0.6).setDepth(2000)
      this.tweens.add({
        targets: glow,
        scale: 1.8,
        alpha: 0,
        duration: 1200,
        ease: 'Sine.easeOut',
        onComplete: () => glow.destroy(),
      })

      this.time.delayedCall(600, () => {
        this.showToast('井栏已封护')
        this.time.delayedCall(800, () => this.completeLevel())
      })
    }
  }
  
  // ===== 通关 =====
  private completeLevel() {
    if (this.completed) return
    this.completed = true
    this.time.delayedCall(500, () => this.showKnowledgeCard())
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
    // 🌟 先标记通关，再做全关判断
    LevelProgress.markCompleted(this.level.id)
    const isPerfect = true // 如果有关卡失误记录，替换成对应的变量
    const reward = CoinSystem.rewardLevel(this.level.id, isPerfect)
    CoinSystem.showFloatText(this, reward)
    // 判断拙政园是否所有关卡通关
    const currentWorld = worlds.find(w => w.id === 'suzhou-garden')
    if (currentWorld?.levels?.every(lv => LevelProgress.isCompleted(lv.id))) {
      showCatPostcard(this, 'suzhou-garden')
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