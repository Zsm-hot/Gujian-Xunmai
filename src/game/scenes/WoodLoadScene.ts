import { worlds } from '../data/worlds.ts'
import { showCatPostcard } from '../ui/CatPostcardUI.ts'
import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { paintWood } from '../world/paintWood.ts'
import { woodLoadLevel } from '../data/levels/wood-load.ts'
import type { LoadLevelConfig } from '../types.ts'
import { CoinSystem } from '../systems/CoinSystem.ts'

// 布局常量
const FLOOR_W = 300
const FLOOR_H = 100
const FLOOR_POS = [
  { x: 640, y: 260 }, // 上
  { x: 640, y: 380 }, // 中
  { x: 640, y: 500 }, // 下
]

const SPAWN_Y = 680

type FloorData = {
  id: number
  x: number
  y: number
  count: number
  container: Phaser.GameObjects.Container
  bg: Phaser.GameObjects.Graphics
  text: Phaser.GameObjects.Text
}

type TouristNode = {
  id: number
  container: Phaser.GameObjects.Container
}

export class WoodLoadScene extends Phaser.Scene {
  private level!: LoadLevelConfig
  private overlayOpen = false
  private dialogueIndex = 0
  private completed = false

  private floors: FloorData[] = []
  private tourists: TouristNode[] = []
  private nextTouristId = 1
  private draggingTourist: TouristNode | null = null

  private totalTimeLeft = 0
  private safeTimeCount = 0
  private timeText!: Phaser.GameObjects.Text
  private safeText!: Phaser.GameObjects.Text
  private timerEvent!: Phaser.Time.TimerEvent

  constructor() {
    super('WoodLoadScene')
  }

  create() {
    this.level = woodLoadLevel
    this.overlayOpen = false
    this.dialogueIndex = 0
    this.completed = false
    this.floors = []
    this.tourists = []
    this.draggingTourist = null
    this.safeTimeCount = 0
    this.totalTimeLeft = this.level.totalSeconds * 1000

    paintWood(this)
    this.createNpc()

    for (let i = 0; i < 3; i += 1) {
      this.buildFloor(i, FLOOR_POS[i].x, FLOOR_POS[i].y)
    }

    this.buildHud()

    // ★ 开局：全部挤在"中层"
    this.spawnAllInMiddle()

    this.setupDrag()

    this.startTimers()
  }

  private createNpc() {
    const root = this.add.container(120, 580).setDepth(1500)
    const bg = this.add.graphics()
    bg.fillStyle(palette.timber, 1)
    bg.fillRoundedRect(-30, -50, 60, 60, 8)
    root.add(bg)
    root.add(this.add.text(0, -20, '🧔', { fontSize: '32px' }).setOrigin(0.5))
    root.add(this.add.text(0, 20, this.level.npc.name, {
      fontFamily: UI_FONT, fontSize: '13px', color: '#efe6d8', backgroundColor: '#4a453fee', padding: { x: 6, y: 2 }
    }).setOrigin(0.5))
    root.setSize(60, 60).setInteractive({ useHandCursor: true })
    root.on('pointerup', () => this.openDialogue(0))
  }

  private buildFloor(id: number, x: number, y: number) {
    const container = this.add.container(x, y).setDepth(1000)

    const bg = this.add.graphics()
    bg.fillStyle(0x8a5a30, 0.4)
    bg.fillRoundedRect(-FLOOR_W / 2, -FLOOR_H / 2, FLOOR_W, FLOOR_H, 8)
    bg.lineStyle(2, 0x5a3a1a, 0.8)
    bg.strokeRoundedRect(-FLOOR_W / 2, -FLOOR_H / 2, FLOOR_W, FLOOR_H, 8)
    container.add(bg)

    const text = this.add
      .text(-FLOOR_W / 2 + 16, -FLOOR_H / 2 + 14, `0 / ${this.level.capacity}`, {
        fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', fontStyle: 'bold',
      })
    container.add(text)

    const names = ['上 层', '中 层', '下 层']
    const label = this.add
      .text(0, 0, names[id], { fontFamily: UI_FONT, fontSize: '32px', color: '#5a3a1a' })
      .setOrigin(0.5)
      .setAlpha(0.15)
    container.add(label)

    this.floors.push({ id, x, y, count: 0, container, bg, text })
  }

  // ★ 全部挤在中层
  private spawnAllInMiddle() {
    const middleFloor = this.floors[1]
    const total = 12

    for (let i = 0; i < total; i++) {
      const x = middleFloor.x + Phaser.Math.Between(-120, 120)
      const y = middleFloor.y + Phaser.Math.Between(-30, 40)
      this.createTourist(x, y)
      middleFloor.count += 1
    }

    this.updateFloorVisual(middleFloor)
  }

  private createTourist(x: number, y: number) {
    const container = this.add.container(x, y).setDepth(1100)
    container.setScale(0.8)

    const g = this.add.graphics()
    g.fillStyle(0x4a6a4a, 1)
    g.fillCircle(0, 0, 14)
    g.fillStyle(0xd8b090, 1)
    g.fillCircle(0, -16, 8)
    g.fillStyle(0x1a1a1a, 1)
    g.fillCircle(-3, -18, 1.5)
    g.fillCircle(3, -18, 1.5)
    container.add(g)

    const hit = this.add.rectangle(0, 0, 40, 40, 0x000000, 0.001).setInteractive({ useHandCursor: true })
    container.add(hit)

    const tourist: TouristNode = { id: this.nextTouristId++, container }
    this.tourists.push(tourist)

    hit.on('pointerdown', () => {
      if (this.overlayOpen) return
      this.draggingTourist = tourist
      container.setDepth(3500)
      container.setScale(1.3)
      // 记录原楼层
      const startFloor = this.floors.find(f => {
        return (
          container.x > f.x - FLOOR_W / 2 &&
          container.x < f.x + FLOOR_W / 2 &&
          container.y > f.y - FLOOR_H / 2 - 20 &&
          container.y < f.y + FLOOR_H / 2 + 20
        )
      })
      tourist.container.setData('startFloor', startFloor ?? null)
    })
  }

  private setupDrag() {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.draggingTourist) return
      this.draggingTourist.container.setPosition(pointer.x, pointer.y)
    })

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.draggingTourist) return
      const tourist = this.draggingTourist
      this.draggingTourist = null
      tourist.container.setScale(0.8)

      let closestFloor: FloorData | null = null
      let minDist = 9999

      for (const f of this.floors) {
        if (
          pointer.x > f.x - FLOOR_W / 2 && 
          pointer.x < f.x + FLOOR_W / 2 &&
          pointer.y > f.y - FLOOR_H / 2 - 20 && 
          pointer.y < f.y + FLOOR_H / 2 + 20
        ) {
          const d = Math.abs(pointer.y - f.y)
          if (d < minDist) {
            minDist = d
            closestFloor = f
          }
        }
      }

      if (closestFloor) {
        if (closestFloor.count >= this.level.capacity) {
          this.showToast('该层已满')
          this.returnToStart(tourist)
          return
        }
        this.addTouristToFloor(tourist, closestFloor)
      } else {
        this.returnToStart(tourist)
      }
    })
  }

  private returnToStart(tourist: TouristNode) {
    const startFloor = tourist.container.getData('startFloor') as FloorData | null
    if (startFloor) {
      // 放回原楼层
      const offsetX = Phaser.Math.Between(-120, 120)
      const offsetY = Phaser.Math.Between(-20, 30)
      tourist.container.setDepth(1100)
      this.tweens.add({
        targets: tourist.container,
        x: startFloor.x + offsetX,
        y: startFloor.y + offsetY,
        duration: 300,
      })
    } else {
      // 否则回底部
      tourist.container.setDepth(1500)
      this.tweens.add({
        targets: tourist.container,
        x: Phaser.Math.Between(250, 1050),
        y: SPAWN_Y,
        duration: 300,
      })
    }
  }

  private addTouristToFloor(tourist: TouristNode, floor: FloorData) {
    floor.count += 1
    this.updateFloorVisual(floor)

    // 从原楼层减去
    const startFloor = tourist.container.getData('startFloor') as FloorData | null
    if (startFloor && startFloor !== floor) {
      startFloor.count = Math.max(0, startFloor.count - 1)
      this.updateFloorVisual(startFloor)
    }

    const offsetX = Phaser.Math.Between(-120, 120)
    const offsetY = Phaser.Math.Between(-20, 30)

    tourist.container.setDepth(1100)
    this.tweens.add({
      targets: tourist.container,
      x: floor.x + offsetX,
      y: floor.y + offsetY,
      duration: 300,
      ease: 'Power2'
    })

    const flash = this.add.rectangle(floor.x, floor.y, FLOOR_W, FLOOR_H, 0xffffff, 0.2).setDepth(1050)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    })
  }

  private updateFloorVisual(floor: FloorData) {
    const cap = this.level.capacity
    const c = floor.count

    let color = 0x7ac88a // 绿
    let fillAlpha = 0.3
    let textColor = '#2a5a2a'

    if (c >= cap) {
      color = 0xd04848
      fillAlpha = 0.5
      textColor = '#7a1f1f'
    } else if (c >= cap - 2) {
      color = 0xe8c060
      fillAlpha = 0.4
      textColor = '#6a4a1a'
    }

    floor.bg.clear()
    floor.bg.fillStyle(color, fillAlpha)
    floor.bg.fillRoundedRect(-FLOOR_W / 2, -FLOOR_H / 2, FLOOR_W, FLOOR_H, 8)
    floor.bg.lineStyle(3, color, 0.9)
    floor.bg.strokeRoundedRect(-FLOOR_W / 2, -FLOOR_H / 2, FLOOR_W, FLOOR_H, 8)

    floor.text.setText(`${c} / ${cap}`).setColor(textColor)
  }

  private startTimers() {
    this.timerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (this.completed) return
        this.totalTimeLeft -= 100
        if (this.totalTimeLeft <= 0) {
          this.totalTimeLeft = 0
          this.gameOver()
          return
        }
        this.timeText.setText(`剩余：${Math.ceil(this.totalTimeLeft / 1000)} 秒`)

        const anyRed = this.floors.some((f) => f.count >= this.level.capacity)
        if (!anyRed) {
          this.safeTimeCount += 100
          this.safeText.setText(
            `安全累积：${(this.safeTimeCount / 1000).toFixed(1)} / ${this.level.targetSafeSeconds} 秒`
          )
          this.safeText.setColor('#2a5a2a')
          if (this.safeTimeCount >= this.level.targetSafeSeconds * 1000) {
            this.gameWin()
          }
        } else {
          this.safeTimeCount = 0
          this.safeText.setText(`安全累积：0 秒（过载！）`)
          this.safeText.setColor('#7a1f1f')
        }
      },
    })
  }

  private gameOver() {
    if (this.completed) return
    this.completed = true
    this.timerEvent.remove()
    this.showToast('时间耗尽，未能完成疏导')
    this.time.delayedCall(1500, () => this.scene.restart())
  }

  private gameWin() {
    if (this.completed) return
    this.completed = true
    this.timerEvent.remove()
    this.time.delayedCall(500, () => this.showKnowledgeCard())
  }

  private buildHud() {
    const hud = roundedPanel(this, 28, 24, 360, 92).setDepth(2000)
    hud.setScrollFactor(0)

    this.add.text(48, 38, `${this.level.chapter} · ${this.level.title}`, {
      fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f'
    }).setDepth(2001)

    this.add.text(48, 70, this.level.objective, {
      fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354'
    }).setDepth(2001)

    const rightBg = roundedPanel(this, 1080, 24, 180, 92).setDepth(2000)
    rightBg.setScrollFactor(0)

    this.timeText = this.add.text(1170, 44, '剩余：30秒', {
      fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001)

    this.safeText = this.add.text(1170, 80, '安全累积：0秒', {
      fontFamily: UI_FONT, fontSize: '14px', color: '#2a5a2a'
    }).setOrigin(0.5).setDepth(2001)

    textButton(this, 1150, 150, '重 来', () => {
      this.scene.restart()
    })
  }

  private openDialogue(startIndex: number) {
    this.dialogueIndex = startIndex
    const line = this.level.npc.dialogue[this.dialogueIndex]
    if (!line) return
    this.children.getByName('dialogue')?.destroy()
    const root = this.add.container(0, 0).setDepth(3000).setName('dialogue')
    const panel = roundedPanel(this, 140, 520, 1000, 160)
    const speaker = this.add.text(168, 540, line.speaker, { fontFamily: UI_FONT, fontSize: '18px', color: '#8d7164' })
    const body = this.add.text(168, 574, line.text, { fontFamily: UI_FONT, fontSize: '20px', color: '#4a453f', wordWrap: { width: 880 } })
    const hint = this.add.text(980, 640, '点击继续', { fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354' })
    root.add([panel, speaker, body, hint])
    const hit = this.add.zone(640, 600, 1000, 160).setInteractive({ useHandCursor: true })
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

  private showKnowledgeCard() {
    if (this.overlayOpen) return
    this.overlayOpen = true
    showKnowledgeCard(this, this.level.knowledgeCard, () => this.showAzhuComment())
  }

  private showAzhuComment() {
    const box = this.add.container(640, 600).setDepth(5000).setAlpha(0)
    const panel = roundedPanel(this, -420, -44, 840, 88, palette.panel)
    const icon = this.add.text(-380, -12, '🌸', { fontSize: '24px' })
    const label = this.add.text(-340, -32, '阿筑', { fontFamily: UI_FONT, fontSize: '14px', color: '#b09a6e' })
    const body = this.add.text(-340, -10, this.level.azhuComment, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', wordWrap: { width: 740 } })
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
    // 🌟 1. 先标记当前关卡通关
    LevelProgress.markCompleted(this.level.id)
    const isPerfect = true // 如果有红区计时变量，请替换
    const reward = CoinSystem.rewardLevel(this.level.id, isPerfect)
    CoinSystem.showFloatText(this, reward)
    // 🌟 2. 判断应县木塔的所有关卡是否都已通关
    const currentWorld = worlds.find(w => w.id === 'yingxian-pagoda')
    if (currentWorld?.levels?.every(lv => LevelProgress.isCompleted(lv.id))) {
      showCatPostcard(this, 'yingxian-pagoda') // 弹出辽猫明信片
    }

    // 3. 渲染原本的成功面板
    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.38).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, this.level.successTitle, { fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, this.level.successBody, { fontFamily: UI_FONT, fontSize: '18px', color: '#6a635b', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5, 0).setDepth(5002)
    
    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'yingxian-pagoda' })
    }).setDepth(5002)
  }

  private showToast(msg: string) {
    const t = this.add.text(640, 120, msg, { fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f', backgroundColor: '#efe6d8ee', padding: { x: 14, y: 8 }, wordWrap: { width: 720 }, align: 'center' }).setOrigin(0.5).setDepth(4000).setAlpha(0)
    this.tweens.add({ targets: t, alpha: 1, y: 108, duration: 220, yoyo: true, hold: 1400, onComplete: () => t.destroy() })
  }
}