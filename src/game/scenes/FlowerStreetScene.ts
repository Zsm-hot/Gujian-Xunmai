
import { worlds } from '../data/worlds.ts'
import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { DragPuzzleInteraction } from '../ui/DragPuzzleInteraction.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts' // 🌟 引入金币系统
import { paintCourtyard } from '../world/paintCourtyard.ts'
import { showCatPostcard } from '../ui/CatPostcardUI.ts'
import {
  flowerStreetPieces,
  flowerStreetSlots,
  flowerStreetHomePositions,
} from '../data/levels/flower-street.ts'

const LEVEL = {
  id: 'forbidden-city-flower-street',
  chapter: '寻脉其一 · 其三',
  title: '花街寻窗',
  objective: '拼补四幅花街窗格纹样',
  knowledgeCard: {
    title: '花街铺地与窗棂纹样',
    content:
      '紫禁城御花园不仅地面有花街铺地，墙上的窗棂更是极具几何美感。\n' +
      '亚字纹、灯笼锦、八角花窗、如意结……\n' +
      '这些方折规整的线条，将阳光切割成吉祥的秩序，铺满宫廷的每一个角落。',
    source: '参考资料：《紫禁城园林建筑与窗棂》',
  },
  azhuComment: '吉祥不在远处——它就在脚下每一块砖石的排列里。',
  successTitle: '花街铺就',
  successBody: '四幅纹样重新拼补完成。花街铺地，吉祥满庭。',
}

export class FlowerStreetScene extends Phaser.Scene {
  private overlayOpen = false
  private attempts = 0

  constructor() {
    super('FlowerStreetScene')
  }

  create() {
    this.overlayOpen = false
    this.attempts = 0

    paintCourtyard(this)

    const uiBg = this.add.graphics().setDepth(900)
    uiBg.fillStyle(palette.paper, 0.82)
    uiBg.fillRoundedRect(160, 140, 960, 500, 20)
    uiBg.lineStyle(2, palette.gold, 0.5)
    uiBg.strokeRoundedRect(160, 140, 960, 500, 20)

    this.add
      .text(640, 168, '· 花 街 寻 窗 ·', {
        fontFamily: UI_FONT, fontSize: '14px', color: '#8d7164',
      })
      .setOrigin(0.5).setDepth(901)

    // 在拼图板上方绘制对应的纹样名称
    const boardTitles = ['亚 字 纹', '灯 笼 纹', '八 角 花 窗', '如 意 结']
    boardTitles.forEach((title, index) => {
      const boardX = 325 + index * 210
      this.add.text(boardX, 195, `· ${title} ·`, {
        fontFamily: UI_FONT,
        fontSize: '16px',
        color: '#8d7164',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(902)
    })

    new DragPuzzleInteraction({
      scene: this,
      pieces: flowerStreetPieces,
      slots: flowerStreetSlots,
      pieceHomePositions: flowerStreetHomePositions,
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
    const hud = roundedPanel(this, 28, 24, 360, 92).setDepth(2000)
    hud.setScrollFactor(0)

    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, {
        fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f',
      }).setDepth(2001)

    this.add.text(48, 70, LEVEL.objective, {
        fontFamily: UI_FONT, fontSize: '16px', color: '#7d6354',
      }).setDepth(2001)

    this.add.text(1230, 38, '拖动下方碎片 → 补全上方纹样', {
        fontFamily: UI_FONT, fontSize: '14px', color: '#efe6d8',
      }).setOrigin(1, 0).setDepth(2001).setAlpha(0.85)

    const poemPanel = roundedPanel(this, 60, 650, 1160, 52, palette.panel).setDepth(2000)
    poemPanel.setScrollFactor(0)

    this.add.text(
        640, 676,
        '· 花街口诀 ·    亚字方折连古韵，灯笼高挂映庭院 ／ 八角花窗透斜阳，如意同心结姻缘',
        {
          fontFamily: UI_FONT, fontSize: '13px', color: '#5a5148',
          wordWrap: { width: 1120, useAdvancedWrap: true }, align: 'center',
        },
      ).setOrigin(0.5).setDepth(2001)
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
    const label = this.add.text(-340, -32, '阿筑', {
      fontFamily: UI_FONT, fontSize: '14px', color: '#b09a6e',
    })
    const body = this.add.text(-340, -10, LEVEL.azhuComment, {
      fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', wordWrap: { width: 740 },
    })
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
    // 先标记通关
       // 先标记通关
    LevelProgress.markCompleted(LEVEL.id)

    // 🌟 完美通关判定（拼图错误次数为 0）
    const isPerfect = this.attempts === 0
    
    // 🌟 发钱！直接传关卡 ID 和是否完美，系统会自动去总表里查该给多少钱
    const reward = CoinSystem.rewardLevel(LEVEL.id, isPerfect)
    CoinSystem.showFloatText(this, reward) // 显示金币飘字

    // ... 下面保持你原本的弹明信片、UI 面板等代码不变 ...

    // 判断全通关弹明信片
    const currentWorld = worlds.find(w => w.id === 'forbidden-city')
    if (currentWorld && currentWorld.levels) {
      const allCompleted = currentWorld.levels.every(lv => LevelProgress.isCompleted(lv.id))
      if (allCompleted) {
        showCatPostcard(this, 'forbidden-city')
      }
    }

    // 渲染成功面板
    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.38).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    
    this.add.text(640, 230, LEVEL.successTitle, {
        fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f',
      }).setOrigin(0.5).setDepth(5002)
      
    this.add.text(640, 300, LEVEL.successBody, {
        fontFamily: UI_FONT, fontSize: '18px', color: '#6a635b', wordWrap: { width: 560 }, align: 'center',
      }).setOrigin(0.5, 0).setDepth(5002)

    if (isPerfect) {
      this.add.text(640, 396, '· 完美通关 ·', {
          fontFamily: UI_FONT, fontSize: '14px', color: '#b8894a',
        }).setOrigin(0.5).setDepth(5002)
    }

    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'forbidden-city' })
    }).setDepth(5002)
  }
  
}