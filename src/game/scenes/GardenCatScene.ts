import { CoinSystem } from '../systems/CoinSystem.ts'
import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { paintGarden } from '../world/paintGarden.ts'
import { gardenCatsLevel } from '../data/levels/garden-cats.ts'
import { isoToScreen } from '../iso.ts'
import type { CatLevelConfig } from '../types.ts'

/** 背景"氛围"的 5 个阶段（对应点 0~5 个脚印后的色调） */
const MOOD_COLORS: { color: number; alpha: number }[] = [
  { color: 0xfff0d0, alpha: 0.0 },   // 刚进入：无
  { color: 0xffe8b0, alpha: 0.1 },   // 点 1 个：暖白
  { color: 0xffd890, alpha: 0.15 },  // 点 2 个：暖黄
  { color: 0xffb060, alpha: 0.2 },   // 点 3 个：橙黄
  { color: 0xc08050, alpha: 0.28 },  // 点 4 个：暮色
  { color: 0xd4a338, alpha: 0.35 },  // 点 5 个：暖金（准备出现猫）
]

export class GardenCatScene extends Phaser.Scene {
  private level!: CatLevelConfig
  private overlayOpen = false
  private dialogueIndex = 0
  private collected: Set<string> = new Set()
  private pawNodes: Map<string, Phaser.GameObjects.Container> = new Map()
  private progressText!: Phaser.GameObjects.Text
  private catsShown = false
  private storageKey!: string

  /** ★ 当前"激活的脚印"（只有它的点击生效） */
  private activePawId: string | null = null

  /** ★ 背景氛围蒙层 */
  private moodLayer!: Phaser.GameObjects.Rectangle

  /** ★ 内心独白文字 */
  private whisperText!: Phaser.GameObjects.Text

  constructor() {
    super('GardenCatScene')
  }

  create() {
    this.level = gardenCatsLevel
    this.storageKey = `gujian-xunmai:progress:${this.level.id}`

    this.overlayOpen = false
    this.dialogueIndex = 0
    this.catsShown = false
    this.collected = new Set()
    this.pawNodes = new Map()
    this.activePawId = null

    // 恢复进度
    this.loadProgress()

    // 背景
       // 背景
    paintGarden(this)

    // 背景氛围蒙层（低 depth，盖在背景上、UI 下）
    this.moodLayer = this.add
      .rectangle(640, 360, 1280, 720, 0xfff0d0, 0)
      .setDepth(100)

    // UI 面板
    const uiBg = this.add.graphics().setDepth(900)
    uiBg.fillStyle(palette.paper, 0.78)
    uiBg.fillRoundedRect(160, 140, 960, 500, 20)
    uiBg.lineStyle(2, palette.gold, 0.5)
    uiBg.strokeRoundedRect(160, 140, 960, 500, 20)

    this.add
      .text(640, 168, '· 巷 陌 寻 踪 ·', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#8d7164',
      })
      .setOrigin(0.5)
      .setDepth(901)

    // NPC
    this.createNpc()

    // 所有脚印（先全建，只有 active 的才亮）
    for (const paw of this.level.pawPrints) {
      const pos = isoToScreen(paw.position.tx, paw.position.ty)
      const node = this.createPawNode(paw.id, paw.name, pos.x, pos.y)
      this.pawNodes.set(paw.id, node)
    }

    // 内心独白（屏幕上方）
    this.whisperText = this.add
      .text(640, 240, '', {
        fontFamily: UI_FONT,
        fontSize: '20px',
        color: '#4a453f',
        backgroundColor: '#efe6d8ee',
        padding: { x: 20, y: 10 },
        wordWrap: { width: 700 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(3500)
      .setAlpha(0)

    this.buildHud()

    // 已完成 → 直接跳到最终
    if (this.collected.size >= this.level.pawPrints.length) {
      this.time.delayedCall(600, () => this.showCatsAndFinish())
      return
    }

    // ★ 刷新"激活的脚印" —— 第一个未收集的
    this.refreshActivePaw()
        // ★ 临时调试：显示鼠标位置的等距坐标
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const TILE_W = 72
      const TILE_H = 36
      const ORIGIN_X = 640
      const ORIGIN_Y = 168

      const dx = (pointer.x - ORIGIN_X) / (TILE_W / 2)
      const dy = (pointer.y - ORIGIN_Y) / (TILE_H / 2)
      const tx = (dx + dy) / 2
      const ty = (dy - dx) / 2

      const existing = this.children.getByName('coord-debug')
      if (existing) existing.destroy()

      this.add
        .text(30, 700, `鼠标位置：tx=${tx.toFixed(2)}, ty=${ty.toFixed(2)}`, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ffffff',
          backgroundColor: '#000000cc',
          padding: { x: 8, y: 4 },
        })
        .setDepth(9999)
        .setName('coord-debug')
    })
  }

  // ===== localStorage =====
  private loadProgress() {
    try {
      const raw = localStorage.getItem(this.storageKey)
      if (!raw) return
      const arr = JSON.parse(raw) as string[]
      if (Array.isArray(arr)) {
        for (const id of arr) this.collected.add(id)
      }
    } catch {
      /* ignore */
    }
  }

  private saveProgress() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([...this.collected]))
    } catch {
      /* ignore */
    }
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

  // ===== 脚印节点（不再显示名字，只显示脚印） =====
  private createPawNode(id: string, _name: string, x: number, y: number) {
    const root = this.add.container(x, y).setDepth(1500)

    // 柔和光圈
    const glow = this.add.circle(0, 0, 26, 0xd4a338, 0.0)
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

    // 脚印符号
    const pawIcon = this.add
      .text(0, 0, '🐾', { fontSize: '32px' })
      .setOrigin(0.5)
      .setAlpha(0)
    root.add(pawIcon)

    // 点击区
    const hit = this.add
      .circle(0, 0, 30, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true })
    root.add(hit)

    // 已收集 → 完全不可见
    if (this.collected.has(id)) {
      root.setAlpha(0)
      root.disableInteractive()
    } else {
      // 默认不可见 + 不可交互 —— 由 refreshActivePaw 激活
      root.setAlpha(0)
      root.disableInteractive()
    }

    hit.on('pointerup', () => {
      if (this.overlayOpen) return
      if (this.activePawId !== id) return   // 只响应"当前激活"的
      this.collectPaw(id, root)
    })

    // 存 glow / pawIcon 引用，供 activate / deactivate 用
    root.setData('glow', glow)
    root.setData('pawIcon', pawIcon)
    root.setData('hit', hit)

    return root
  }

  // ===== 刷新"当前激活的脚印" =====
  private refreshActivePaw() {
    // 找"第一个未收集的"
    const next = this.level.pawPrints.find((p) => !this.collected.has(p.id))
    if (!next) {
      this.activePawId = null
      return
    }

    this.activePawId = next.id

    // 激活：淡入 + 可点
    const node = this.pawNodes.get(next.id)
    if (!node) return
    const glow = node.getData('glow') as Phaser.GameObjects.Arc
    const pawIcon = node.getData('pawIcon') as Phaser.GameObjects.Text
    const hit = node.getData('hit') as Phaser.GameObjects.Arc

    glow.setAlpha(0.3)
    this.tweens.add({ targets: node, alpha: 1, duration: 500 })
    this.tweens.add({ targets: pawIcon, alpha: 1, duration: 500 })
    hit.setInteractive({ useHandCursor: true })

    // 给个"高亮脉冲"暗示
    this.tweens.add({
      targets: pawIcon,
      scale: { from: 1, to: 1.2 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  // ===== 点击脚印 =====
  private collectPaw(id: string, node: Phaser.GameObjects.Container) {
    if (this.collected.has(id)) return

    this.collected.add(id)
    this.saveProgress()

    const pawData = this.level.pawPrints.find((p) => p.id === id)
    if (!pawData) return

    // 视觉：脚印淡出 + 飘起
    const floatPaw = this.add
      .text(node.x, node.y, '🐾', { fontSize: '32px' })
      .setOrigin(0.5)
      .setDepth(4000)
    this.tweens.add({
      targets: floatPaw,
      y: node.y - 60,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      onComplete: () => floatPaw.destroy(),
    })

    const pawIcon = node.getData('pawIcon') as Phaser.GameObjects.Text
    const hit = node.getData('hit') as Phaser.GameObjects.Arc
    this.tweens.add({ targets: node, alpha: 0, duration: 500, delay: 300 })
    this.tweens.add({ targets: pawIcon, alpha: 0, duration: 500, delay: 300 })
    hit.disableInteractive()

    // 更新 HUD
    this.progressText.setText(this.progressLabel())

    // 切换背景氛围
    this.updateMood(this.collected.size)

    // 显示内心独白
    if (pawData.whisper) {
      this.showWhisper(pawData.whisper)
    }

    // 延迟后激活下一个
    this.time.delayedCall(1600, () => {
      if (this.collected.size >= this.level.pawPrints.length) {
        this.showCatsAndFinish()
      } else {
        this.refreshActivePaw()
      }
    })
  }

  // ===== 更新背景氛围 =====
  private updateMood(step: number) {
    if (step < 0 || step >= MOOD_COLORS.length) return
    const mood = MOOD_COLORS[step]
    this.tweens.add({
      targets: this.moodLayer,
      fillAlpha: mood.alpha,
      duration: 1200,
      ease: 'Sine.easeInOut',
    })
    this.moodLayer.setFillStyle(mood.color)
  }

  // ===== 内心独白 =====
  private showWhisper(text: string) {
    this.whisperText.setText(text)
    this.whisperText.setAlpha(0)

    this.tweens.add({
      targets: this.whisperText,
      alpha: 1,
      duration: 400,
      onComplete: () => {
        this.time.delayedCall(1400, () => {
          this.tweens.add({
            targets: this.whisperText,
            alpha: 0,
            duration: 400,
          })
        })
      },
    })
  }

  // ===== 猫咪出现（最终） =====
  private showCatsAndFinish() {
    if (this.catsShown) return
    this.catsShown = true

    // 背景变成"神秘暖金"
    this.tweens.add({
      targets: this.moodLayer,
      fillAlpha: 0.42,
      duration: 1200,
    })
    this.moodLayer.setFillStyle(0xd4a338)

    // 屏幕中心"闪"一下
    const flash = this.add.rectangle(640, 360, 1280, 720, 0xfff4d0, 0).setDepth(6000)
    this.tweens.add({
      targets: flash,
      fillAlpha: 0.6,
      duration: 300,
      yoyo: true,
    })

    // 猫咪出现（特写，屏幕中央）
    const cat = this.add
      .text(640, 360, '🐱', { fontSize: '96px' })
      .setOrigin(0.5)
      .setDepth(6001)
      .setAlpha(0)
      .setScale(0.3)

    this.tweens.add({
      targets: cat,
      alpha: 1,
      scale: 1,
      duration: 700,
      delay: 400,
      ease: 'Back.easeOut',
    })

    // 猫轻轻摆动
    this.tweens.add({
      targets: cat,
      angle: 4,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 1100,
    })

    // "它就在那儿。" 独白
    this.time.delayedCall(1300, () => this.showWhisper('它就在那儿。'))

    // 2 秒后知识卡
    this.time.delayedCall(3200, () => this.showKnowledgeCard())
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

    this.progressText = this.add
      .text(48, 70, this.progressLabel(), {
        fontFamily: UI_FONT,
        fontSize: '16px',
        color: '#7d6354',
      })
      .setDepth(2001)

    this.add
      .text(1230, 38, '跟随脚印 · 一步一步靠近', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#efe6d8',
      })
      .setOrigin(1, 0)
      .setDepth(2001)
      .setAlpha(0.85)
  }

  private progressLabel() {
    return `${this.level.objective}    ${this.collected.size} / ${this.level.pawPrints.length}`
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
      const isPerfect = true // 寻猫关如果没点错就完美。如果有错次数变量，请替换为对应的变量
    const reward = CoinSystem.rewardLevel(this.level.id, isPerfect)
    CoinSystem.showFloatText(this, reward)

    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'suzhou-garden' })
    }).setDepth(5002)
  }

}