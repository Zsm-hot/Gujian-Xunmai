import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { codexEntries } from '../data/codex.ts'
import type { CodexEntry } from '../data/codex.ts'
import type { WorldId } from '../types.ts'
import { worlds } from '../data/worlds.ts'
const WORLD_SEALS: { id: WorldId; name: string; icon: string }[] = [
  { id: 'forbidden-city',  name: '紫禁城',    icon: '🏯' },
  { id: 'suzhou-garden',   name: '拙政园',    icon: '🌸' },
  { id: 'yingxian-pagoda', name: '应县木塔',  icon: '🗼' },
  { id: 'egypt-pyramid',   name: '金字塔',    icon: '🔺' },
  { id: 'petra',           name: '佩特拉',    icon: '🪨' },
  { id: 'dome-rock',       name: '圆顶清真寺', icon: '🕌' },
  { id: 'angkor',          name: '吴哥窟',    icon: '🛕' },
  { id: 'machu-picchu',    name: '马丘比丘',  icon: '⛰️' },
]

const CARD_W = 240
const CARD_H = 110
const COLS = 4
const GAP_X = 20
const GAP_Y = 15

export class CodexScene extends Phaser.Scene {
  private worldId: WorldId | null = null
  private worldName: string | null = null

  constructor() {
    super('CodexScene')
  }

  init(data: { worldId?: WorldId }) {
    if (data && data.worldId) {
      this.worldId = data.worldId
      const found = codexEntries.find((e) => e.worldId === data.worldId)
      this.worldName = found ? found.worldName : null
    } else {
      this.worldId = null
      this.worldName = null
    }
  }

  create() {
    this.paintBackground()
    this.paintHeader()
    this.paintCodexGrid()
    this.paintFooter()

    // ★ 加在这里
    if (!this.worldId) {
      this.paintWorldSeals()
    }
  }
        // ★ 如果是八方图鉴，顶部绘制"八枚印记"

  private paintBackground() {
    const g = this.add.graphics()
    g.fillGradientStyle(palette.paper, palette.paper, palette.mist, palette.sky, 1)
    g.fillRect(0, 0, 1280, 720)

    g.fillStyle(palette.sage, 0.2)
    g.fillEllipse(240, 640, 400, 100)
    g.fillStyle(palette.moss, 0.18)
    g.fillEllipse(1040, 180, 380, 90)
  }

  private paintHeader() {
    const title = this.worldName ? `${this.worldName}图鉴` : '八 方 图 鉴'
    this.add
      .text(640, 56, title, {
        fontFamily: UI_FONT,
        fontSize: '36px',
        color: '#4a453f',
      })
      .setOrigin(0.5)

    const subtitle = this.worldName ? '寻脉所见 · 皆入此录' : '八方所见 · 皆入此录'
    this.add
      .text(640, 100, subtitle, {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#7d6354',
      })
      .setOrigin(0.5)
      .setAlpha(0.8)

    textButton(this, 130, 60, '← 返回', () => {
      if (this.worldId) {
        this.scene.start('WorldDetailScene', { worldId: this.worldId })
      } else {
        this.scene.start('WorldMapScene')
      }
    })
  }

  private paintCodexGrid() {
    let allEntries: CodexEntry[] = []

    if (this.worldId) {
      allEntries = codexEntries.filter((e) => e.worldId === this.worldId)
    } else {
      allEntries = [...codexEntries]
    }

    const totalW = COLS * CARD_W + (COLS - 1) * GAP_X
    const startX = 640 - totalW / 2 + CARD_W / 2
    const startY = 340

    allEntries.forEach((entry, i) => {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const x = startX + col * (CARD_W + GAP_X)
      const y = startY + row * (CARD_H + GAP_Y)
      this.paintCodexCard(entry, x, y)
    })
  }
  // ===== 八方图鉴 · 顶部八枚印记 =====
   private paintWorldSeals() {
    // ★ 让 4 列居中
    const itemsPerRow = 4
    const spacingX = 90   // 水平间距
    const spacingY = 70   // 垂直间距
    const startX = 640 - ((itemsPerRow - 1) * spacingX) / 2   // 第一排的起点
    const startY = 140

    WORLD_SEALS.forEach((seal, i) => {
      const col = i % itemsPerRow
      const row = Math.floor(i / itemsPerRow)
      const x = startX + col * spacingX
      const y = startY + row * spacingY

      // 判断"该世界是否全部通关"
      const world = worlds.find((w) => w.id === seal.id)
      const levels = world?.levels ?? []
      const isDone = levels.length > 0 && levels.every((l) => LevelProgress.isCompleted(l.id))

      // 印章底
      const g = this.add.graphics().setDepth(2000)
      g.fillStyle(isDone ? 0xd4a338 : 0x8a8272, 0.2)
      g.fillCircle(x, y, 24)   // 稍微缩小一点
      g.lineStyle(2, isDone ? 0xd4a338 : 0x8a8272, isDone ? 0.9 : 0.4)
      g.strokeCircle(x, y, 24)

      // 图标
      this.add
        .text(x, y - 4, seal.icon, { fontSize: '22px' })
        .setOrigin(0.5)
        .setDepth(2001)

      // 名字
      this.add
        .text(x, y + 30, seal.name, {
          fontFamily: UI_FONT,
          fontSize: '12px',
          color: isDone ? '#b09a6e' : '#9a8d7a',
        })
        .setOrigin(0.5)
        .setDepth(2001)
    })
  }
  private paintCodexCard(entry: CodexEntry, cx: number, cy: number) {
    const unlocked = LevelProgress.isCompleted(entry.id)
    const fillColor = unlocked ? palette.panel : palette.mist
    const alpha = unlocked ? 0.96 : 0.5
    const textColor = unlocked ? '#4a453f' : '#9a8d7a'

    const container = this.add.container(cx, cy)

    const panel = roundedPanel(
      this,
      -CARD_W / 2,
      -CARD_H / 2,
      CARD_W,
      CARD_H,
      fillColor,
    )
    panel.setAlpha(alpha)
    container.add(panel)

    const num = this.add.text(
      -CARD_W / 2 + 16,
      -CARD_H / 2 + 14,
      `其${entry.worldName.charAt(0)}`,
      {
        fontFamily: UI_FONT,
        fontSize: '12px',
        color: unlocked ? '#b09a6e' : '#9a8d7a',
      },
    )
    container.add(num)

    const title = this.add
      .text(0, -22, entry.title, {
        fontFamily: UI_FONT,
        fontSize: '20px',
        color: textColor,
      })
      .setOrigin(0.5)
    container.add(title)

    const statusText = unlocked ? '已收录' : '未解锁'
    const statusColor = unlocked ? '#5a8a4a' : '#9a8d7a'
    const status = this.add
      .text(0, 16, `· ${statusText} ·`, {
        fontFamily: UI_FONT,
        fontSize: '13px',
        color: statusColor,
      })
      .setOrigin(0.5)
    container.add(status)

    const world = this.add
      .text(0, CARD_H / 2 - 20, entry.worldName, {
        fontFamily: UI_FONT,
        fontSize: '12px',
        color: unlocked ? '#7d6354' : '#9a8d7a',
      })
      .setOrigin(0.5)
    container.add(world)

    container.setSize(CARD_W, CARD_H)
    container.setInteractive(
      new Phaser.Geom.Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H),
      Phaser.Geom.Rectangle.Contains,
    )
    container.on('pointerover', () => {
      if (unlocked) panel.setAlpha(1)
    })
    container.on('pointerout', () => {
      panel.setAlpha(alpha)
    })
    container.on('pointerup', () => {
      if (!unlocked) {
        this.showToast('通关该关卡后，方可收录')
        return
      }
      this.showCodexDetail(entry)
    })
  }

  private showCodexDetail(entry: CodexEntry) {
    const card = entry.knowledgeCard

    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.62).setDepth(5000)
    roundedPanel(this, 220, 140, 840, 440, palette.panel).setDepth(5001)

    const deco = this.add.graphics().setDepth(5002)
    deco.lineStyle(2, palette.gold, 0.5)
    deco.beginPath()
    deco.moveTo(300, 200)
    deco.lineTo(980, 200)
    deco.strokePath()

    this.add
      .text(640, 178, '图 鉴 · 已 收 录', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#b09a6e',
      })
      .setOrigin(0.5)
      .setDepth(5002)

    this.add
      .text(640, 240, card.title, {
        fontFamily: UI_FONT,
        fontSize: '28px',
        color: '#4a453f',
      })
      .setOrigin(0.5)
      .setDepth(5002)

    this.add
      .text(640, 310, card.content, {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: '#5a5148',
        align: 'left',
        lineSpacing: 10,
        wordWrap: { width: 720, useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0)
      .setDepth(5002)

    if (card.source) {
      this.add
        .text(640, 520, card.source, {
          fontFamily: UI_FONT,
          fontSize: '13px',
          color: '#9a8d7a',
          align: 'center',
          wordWrap: { width: 720 },
        })
        .setOrigin(0.5)
        .setDepth(5002)
    }

    const closeBtn = textButton(this, 640, 560, '关 闭', () => {
      this.scene.restart()
    })
    closeBtn.setDepth(5003)
  }

  private paintFooter() {
    let total = 0
    let unlocked = 0

    if (this.worldId) {
      const list = codexEntries.filter((e) => e.worldId === this.worldId)
      total = list.length
      unlocked = list.filter((e) => LevelProgress.isCompleted(e.id)).length
    } else {
      total = codexEntries.length
      unlocked = codexEntries.filter((e) => LevelProgress.isCompleted(e.id)).length
    }

    this.add
      .text(640, 705, `已收录：${unlocked} / ${total}`, {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#7d6354',
      })
      .setOrigin(0.5)
      .setAlpha(0.75)
  }

  private showToast(msg: string) {
    const t = this.add
      .text(640, 620, msg, {
        fontFamily: UI_FONT,
        fontSize: '16px',
        color: '#4a453f',
        backgroundColor: '#efe6d8ee',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(9999)
      .setAlpha(0)

    this.tweens.add({
      targets: t,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 1200,
      onComplete: () => t.destroy(),
    })
  }
}