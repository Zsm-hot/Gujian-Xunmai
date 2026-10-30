import { LevelProgress } from '../systems/LevelProgress.ts'
import Phaser from 'phaser'
import { ridgeBeastLevel } from '../data/levels/ridge-beasts.ts'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { DragSortInteraction } from '../ui/DragSortInteraction.ts'
import { createNpc } from '../world/actors.ts'
import { paintCourtyard } from '../world/paintCourtyard.ts'

export class RidgeBeastScene extends Phaser.Scene {
  private dialogueIndex = 0
  private overlayOpen = false
  private attempts = 0

  constructor() {
    super('RidgeBeastScene')
  }
 preload() {
    // 动态加载所有脊兽图片
    ridgeBeastLevel.items.forEach(item => {
      // 类型断言，因为你的类型里可能还没加 image，但数据里已经有了
      const beast = item as any; 
      if (beast.image) {
        // 用 item.id 作为贴图 Key
        this.load.image(item.id, beast.image)
      }
    })
  }
  create() {
    const level = ridgeBeastLevel
    this.dialogueIndex = 0
    this.overlayOpen = false
    this.attempts = 0

    // 复用故宫背景绘制
    paintCourtyard(this)

    // ===== UI 半透明面板（避免和背景建筑冲突）=====
    const uiBg = this.add.graphics().setDepth(900)
    uiBg.fillStyle(palette.paper, 0.78)
    uiBg.fillRoundedRect(160, 150, 960, 480, 20)
    uiBg.lineStyle(2, palette.gold, 0.5)
    uiBg.strokeRoundedRect(160, 150, 960, 480, 20)

    // 面板小标题
    this.add
      .text(640, 178, '· 脊 兽 法 式 ·', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#8d7164',
      })
      .setOrigin(0.5)
      .setDepth(901)

    // ===== NPC（左下角，半透明面板之外）=====
    const npc = createNpc(this, level.npc)
    npc.setDepth(950)
    npc.setPosition(150, 520)
    npc.on('pointerup', () => {
      if (this.overlayOpen) return
      this.openDialogue(0)
    })

    // ===== 拖拽排序组件 =====
    new DragSortInteraction({
      scene: this,
      items: level.items,
      slots: level.slots,
      answer: level.answer,
      baseX: 640,
      baseY: 260,// 槽位行 y
      onAllCorrect: () => {
        this.time.delayedCall(500, () => this.showKnowledgeCard())
      },
      onWrong: () => {
        this.attempts += 1
      },
    })

    this.buildHud()
  }

  private buildHud() {
    const level = ridgeBeastLevel

    // 左上：HUD
    const hud = roundedPanel(this, 28, 24, 360, 92).setDepth(2000)
    hud.setScrollFactor(0)

    this.add
      .text(48, 38, `${level.chapter} · ${level.title}`, {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: '#4a453f',
      })
      .setDepth(2001)

    this.add
      .text(48, 70, level.objective, {
        fontFamily: UI_FONT,
        fontSize: '16px',
        color: '#7d6354',
      })
      .setDepth(2001)

    // 右上：操作提示
    this.add
      .text(1230, 38, '拖动下方脊兽 → 放入上方槽位', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#efe6d8',
      })
      .setOrigin(1, 0)
      .setDepth(2001)
      .setAlpha(0.85)
         // ===== 法式口诀（底部横排长条）=====
       // ===== 法式口诀（底部横排长条）=====
    const poem = [
      '龙凤为帝后之首，稳居最前',
      '狮为镇宅护法，位列第三',
      '天马海马，通天入海、戍守疆土',
      '狻猊镇火、押鱼治水，护木构宫殿平安',
      '獬豸辨是非、斗牛除灾祸',
      '行什为雷神镇殿，仅太和殿独有、压轴收尾',
    ]

    // 底部面板：加高一点以容纳两行文字
    const poemPanel = roundedPanel(this, 60, 630, 1160, 80, palette.panel).setDepth(2000)
    poemPanel.setScrollFactor(0)

    // 将 6 句拼成两行，用 "  ／  " 分隔
    const poemLine = poem.join('   ／   ')

    this.add
      .text(640, 670, `· 法式口诀 ·\n${poemLine}`, {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#5a5148',
        wordWrap: { width: 1120, useAdvancedWrap: true },
        align: 'center',
        lineSpacing: 8, // 行间距
      })
      .setOrigin(0.5)
      .setDepth(2001)
    }

  // ===== 对话 =====
  private openDialogue(startIndex: number) {
    this.dialogueIndex = startIndex
    const level = ridgeBeastLevel
    const line = level.npc.dialogue[this.dialogueIndex]
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
    const level = ridgeBeastLevel
    this.dialogueIndex += 1
    if (this.dialogueIndex >= level.npc.dialogue.length) {
      this.children.getByName('dialogue')?.destroy()
      return
    }
    this.openDialogue(this.dialogueIndex)
  }

  // ===== 知识卡 =====
  private showKnowledgeCard() {
    if (this.overlayOpen) return
    this.overlayOpen = true
    const level = ridgeBeastLevel
    this.children.getByName('dialogue')?.destroy()

    showKnowledgeCard(this, level.knowledgeCard, () => {
      this.showAzhuComment()
    })
  }

  // ===== 阿筑短评 =====
  private showAzhuComment() {
    const level = ridgeBeastLevel

    const box = this.add.container(640, 600).setDepth(5000).setAlpha(0)

    const panel = roundedPanel(this, -420, -44, 840, 88, palette.panel)
    const icon = this.add.text(-380, -12, '🌸', { fontSize: '24px' })
    const label = this.add.text(-340, -32, '阿筑', {
      fontFamily: UI_FONT,
      fontSize: '14px',
      color: '#b09a6e',
    })
    const body = this.add.text(-340, -10, level.azhuComment, {
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
    const level = ridgeBeastLevel

    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.38).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add
      .text(640, 230, level.successTitle, {
        fontFamily: UI_FONT,
        fontSize: '32px',
        color: '#4a453f',
      })
      .setOrigin(0.5)
      .setDepth(5002)
    this.add
      .text(640, 300, level.successBody, {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: '#6a635b',
        wordWrap: { width: 560 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setDepth(5002)

    // 完美通关标记（0 次错误）
    if (this.attempts === 0) {
      this.add
        .text(640, 396, '· 完美通关 ·', {
          fontFamily: UI_FONT,
          fontSize: '14px',
          color: '#b8894a',
        })
        .setOrigin(0.5)
        .setDepth(5002)
    }

    // 标记通关
    LevelProgress.markCompleted('forbidden-city-ridge-beasts')

    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'forbidden-city' })
    }).setDepth(5002)
  }
}