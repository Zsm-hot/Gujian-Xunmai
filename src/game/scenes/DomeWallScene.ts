import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts' // 🌟 引入金币系统
import { paintDome } from '../world/domeDrawers.ts'
import { domeWallLevel } from '../data/levels/dome-wall.ts'

const LEVEL = domeWallLevel

type PieceType = 'center_cross' | 'inner_square' | 'arm_up' | 'arm_down' | 'arm_left' | 'arm_right'

const U = 45
const LINE_W = 10
const COLOR_BLUE = 0x2b4162

export class DomeWallScene extends Phaser.Scene {
  private overlayOpen = false
  private completed = false
  private stage: 1 | 2 = 1

  private wallCx = 640
  private wallCy = 400
  private wallCols = 4 
  private wallRows = 3 

  private baseCx = 640
  private baseCy = 400
  private basePlaced = 0
  private piecePositions = new Map<PieceType, { x: number; y: number }>()
  
  private slotMap = new Map<string, Phaser.GameObjects.Container>()
  private matrixPlaced = 0
  private totalMatrixSlots = 0

  private hudText!: Phaser.GameObjects.Text

  constructor() {
    super('DomeWallScene')
  }

  create() {
    this.overlayOpen = false
    this.completed = false
    this.stage = 1
    this.basePlaced = 0
    this.matrixPlaced = 0
    this.piecePositions.clear()
    this.slotMap.clear()

    paintDome(this)
    this.buildHud()
    this.drawWallBackground()
    this.startStage1()
  }

  private drawWallBackground() {
    const w = this.wallCols * (U * 3)
    const h = this.wallRows * (U * 3)
    
    const wall = this.add.graphics().setDepth(10)
    wall.fillStyle(0x000000, 0.2)
    wall.fillRoundedRect(this.wallCx - w / 2 + 10, this.wallCy - h / 2 + 15, w, h, 8)
    wall.fillStyle(0xeef2f5, 1) 
    wall.fillRoundedRect(this.wallCx - w / 2, this.wallCy - h / 2, w, h, 8)
    wall.lineStyle(4, 0x8898aa, 1)
    wall.strokeRoundedRect(this.wallCx - w / 2, this.wallCy - h / 2, w, h, 8)
  }

  private startStage1() {
    this.hudText.setText('第一阶段：将骨架碎片嵌入底板，拼合几何花砖')

    const shadowG = this.add.graphics().setDepth(20)
    
    const slots = [
      { type: 'center_cross', x: 0, y: 0 },
      { type: 'inner_square', x: 0, y: 0 },
      { type: 'arm_up', x: 0, y: -U*1.5 },
      { type: 'arm_down', x: 0, y: U*1.5 },
      { type: 'arm_left', x: -U*1.5, y: 0 },
      { type: 'arm_right', x: U*1.5, y: 0 },
    ]

    slots.forEach(s => {
      shadowG.lineStyle(2, 0x2b4162, 0.15)
      if (s.type === 'center_cross') {
        shadowG.strokeRect(-U*0.5, -U*1.5, U, U*3)
        shadowG.strokeRect(-U*1.5, -U*0.5, U*3, U)
      } else if (s.type === 'inner_square') {
        shadowG.strokeRect(-U*0.3, -U*0.3, U*0.6, U*0.6)
      } else if (s.type === 'arm_up' || s.type === 'arm_down') {
        shadowG.fillRect(-U*0.3, -U*0.5, U*0.6, U)
      } else {
        shadowG.fillRect(-U*0.5, -U*0.3, U, U*0.6)
      }
      
      this.piecePositions.set(s.type as PieceType, { x: this.baseCx + s.x, y: this.baseCy + s.y })
    })

    const spawnPoints = [
      { type: 'center_cross', x: 300, y: 400 },
      { type: 'inner_square', x: 800, y: 200 },
      { type: 'arm_up', x: 200, y: 200 },
      { type: 'arm_down', x: 900, y: 600 },
      { type: 'arm_left', x: 250, y: 600 },
      { type: 'arm_right', x: 1000, y: 400 },
    ]

    spawnPoints.forEach(p => {
      this.createDraggablePiece(p.type as PieceType, p.x, p.y)
    })
  }

  private createDraggablePiece(type: PieceType, startX: number, startY: number) {
    const container = this.add.container(startX, startY).setDepth(500)
    const g = this.add.graphics()
    
    g.lineStyle(LINE_W, COLOR_BLUE, 1)
    g.fillStyle(0xeef2f5, 1) 

    if (type === 'center_cross') {
      g.fillRect(-U*0.5, -U*1.5, U, U*3)
      g.fillRect(-U*1.5, -U*0.5, U*3, U)
      g.strokeRect(-U*0.5, -U*1.5, U, U*3)
      g.strokeRect(-U*1.5, -U*0.5, U*3, U)
    } else if (type === 'inner_square') {
      g.fillRect(-U*0.4, -U*0.4, U*0.8, U*0.8)
      g.strokeRect(-U*0.4, -U*0.4, U*0.8, U*0.8)
    } else if (type.startsWith('arm')) {
      if (type === 'arm_up' || type === 'arm_down') {
        const dy = type === 'arm_up' ? -U : U
        g.fillRect(-U*0.3, dy, U*0.6, U*0.5)
        g.strokeRect(-U*0.3, dy, U*0.6, U*0.5)
      } else {
        const dx = type === 'arm_left' ? -U : U
        g.fillRect(dx, -U*0.3, U*0.5, U*0.6)
        g.strokeRect(dx, -U*0.3, U*0.5, U*0.6)
      }
    }

    container.add(g)
    container.setSize(U * 3, U * 3).setInteractive({ useHandCursor: true, draggable: true })

    container.on('dragstart', () => {
      container.setDepth(1000)
      container.setScale(1.05)
    })
    
    container.on('drag', (_p: any, dragX: number, dragY: number) => {
      container.x = dragX
      container.y = dragY
    })

    container.on('dragend', () => {
      container.setDepth(500)
      container.setScale(1)
      
      const target = this.piecePositions.get(type)
      if (!target) return

      const dist = Phaser.Math.Distance.Between(container.x, container.y, target.x, target.y)
      
      if (dist < 40) {
        this.tweens.add({
          targets: container,
          x: target.x,
          y: target.y,
          duration: 150,
          ease: 'Power2',
          onComplete: () => {
            container.disableInteractive()
            this.basePlaced++
            this.flashAt(target.x, target.y)
            
            if (this.basePlaced === 6) {
              this.showToast('基础花砖拼合完成！')
              this.time.delayedCall(800, () => this.startStage2())
            }
          }
        })
      } else {
        this.tweens.add({
          targets: container, x: startX, y: startY, duration: 300, ease: 'Back.easeOut'
        })
      }
    })
  }

  private flashAt(x: number, y: number) {
    const flash = this.add.circle(x, y, 30, 0xffffff, 0.6).setDepth(900)
    this.tweens.add({ targets: flash, scale: 2, alpha: 0, duration: 300, onComplete: () => flash.destroy() })
  }

  private startStage2() {
    this.stage = 2
    this.hudText.setText(`第二阶段：观察石板上的符号提示，选择正确的规则铺满`)

    this.totalMatrixSlots = (this.wallCols * this.wallRows) - 1 
    
    for (let r = 0; r < this.wallRows; r++) {
      for (let c = 0; c < this.wallCols; c++) {
        const tx = this.wallCx - (this.wallCols * U * 3) / 2 + (U * 1.5) + c * (U * 3)
        const ty = this.wallCy - (this.wallRows * U * 3) / 2 + (U * 1.5) + r * (U * 3)
        
        if (tx === this.baseCx && ty === this.baseCy) continue

        let ruleIcon = '↔'
        let ruleType = 'mirror'
        let color = 0x4a90e2 
        if (r === 0) { ruleIcon = '⟳'; ruleType = 'rotate'; color = 0xe67e22 } 
        if (r === 2) { ruleIcon = '↕'; ruleType = 'flip'; color = 0x2ecc71 } 

        const slotContainer = this.add.container(tx, ty).setDepth(30)
        
        const g = this.add.graphics()
        g.lineStyle(2, color, 0.3)
        g.fillStyle(0x2b4162, 0.05)
        g.fillRect(-U*1.5, -U*1.5, U*3, U*3)
        g.strokeRect(-U*1.5, -U*1.5, U*3, U*3)
        slotContainer.add(g)

        const iconText = this.add.text(0, 0, ruleIcon, { 
          fontSize: '48px', color: '#000000', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0.1) 
        slotContainer.add(iconText)

        slotContainer.setData('expectedRule', ruleType)
        this.slotMap.set(`${c}_${r}`, slotContainer)
      }
    }

    const btnRules = [
      { text: '左右镜像 ↔', ruleType: 'mirror' },
      { text: '上下反转 ↕', ruleType: 'flip' },
      { text: '45° 旋转 ⟳', ruleType: 'rotate' },
    ]

    btnRules.forEach((rule, index) => {
      textButton(this, 440 + index * 200, 680, rule.text, () => {
        this.placeMatrixUnit(rule.ruleType)
      }).setDepth(2000)
    })
  }

  private placeMatrixUnit(ruleType: string) {
    if (this.stage !== 2 || this.matrixPlaced >= this.totalMatrixSlots) return

    let targetContainer: Phaser.GameObjects.Container | undefined
    let targetX = 0, targetY = 0
    let found = false 

    for (let r = 0; r < this.wallRows; r++) {
      for (let c = 0; c < this.wallCols; c++) {
        if (c === 1 && r === 1) continue 
        
        const slotObj = this.slotMap.get(`${c}_${r}`)
        if (slotObj && slotObj.visible && slotObj.getData('expectedRule') === ruleType) {
          targetContainer = slotObj
          targetX = slotObj.x
          targetY = slotObj.y
          found = true
          break
        }
      }
      if (found) break
    }

    if (!found || !targetContainer) {
      this.showToast('这面墙上没有该规则的缺口了哦，请换个规则')
      return
    }

    const clone = this.add.container(this.baseCx, this.baseCy).setDepth(400)
    const g = this.add.graphics()
    
    g.lineStyle(LINE_W, COLOR_BLUE, 1)
    g.fillStyle(0xeef2f5, 1)

    g.fillRect(-U*0.5, -U*1.5, U, U*3)
    g.fillRect(-U*1.5, -U*0.5, U*3, U)
    g.strokeRect(-U*0.5, -U*1.5, U, U*3)
    g.strokeRect(-U*1.5, -U*0.5, U*3, U)

    g.fillRect(-U*0.4, -U*0.4, U*0.8, U*0.8)
    g.strokeRect(-U*0.4, -U*0.4, U*0.8, U*0.8)
    
    g.fillRect(-U*0.3, -U*1.5, U*0.6, U*0.5); g.strokeRect(-U*0.3, -U*1.5, U*0.6, U*0.5)
    g.fillRect(-U*0.3, U*1.0, U*0.6, U*0.5); g.strokeRect(-U*0.3, U*1.0, U*0.6, U*0.5)
    g.fillRect(-U*1.5, -U*0.3, U*0.5, U*0.6); g.strokeRect(-U*1.5, -U*0.3, U*0.5, U*0.6)
    g.fillRect(U*1.0, -U*0.3, U*0.5, U*0.6); g.strokeRect(U*1.0, -U*0.3, U*0.5, U*0.6)
    
    clone.add(g)

    if (ruleType === 'mirror') clone.setScale(-1, 1)
    if (ruleType === 'flip') clone.setScale(1, -1)
    if (ruleType === 'rotate') clone.setAngle(45)

    this.tweens.add({
      targets: clone,
      x: targetX, 
      y: targetY,
      angle: (ruleType === 'rotate' ? 45 : 0),
      duration: 350, 
      ease: 'Back.easeOut',
      onComplete: () => {
        targetContainer!.setVisible(false)
        this.matrixPlaced++
        this.flashAt(targetX, targetY)
        this.showToast(`铺设成功 (${this.matrixPlaced}/${this.totalMatrixSlots})`)
        
        if (this.matrixPlaced >= this.totalMatrixSlots) this.completeLevel()
      }
    })
  }

  private completeLevel() {
    if (this.completed) return
    this.completed = true
    this.cameras.main.flash(1500, 255, 255, 220)
    this.showToast('八面圣墙瞬间纹样归一、浮现纯白暗金纹理柔光！')

    const glow = this.add.circle(this.wallCx, this.wallCy, 500, 0xffd700, 0.4).setDepth(3000)
    this.tweens.add({
      targets: glow, scale: 2, alpha: 0, duration: 2000,
      onComplete: () => this.showKnowledgeCard()
    })
  }

  private buildHud() {
    const hud = roundedPanel(this, 28, 24, 420, 92).setDepth(2000)
    hud.setScrollFactor(0)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    this.hudText = this.add.text(48, 70, '', { fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354', wordWrap: { width: 380 } }).setDepth(2001)
    textButton(this, 1150, 100, '重 来', () => { this.scene.restart() }).setDepth(2001)
  }

  private showKnowledgeCard() {
    if (this.overlayOpen) return
    this.overlayOpen = true
    showKnowledgeCard(this, LEVEL.knowledgeCard, () => this.showAzhuComment())
  }

  private showAzhuComment() {
    const box = this.add.container(640, 600).setDepth(5000).setAlpha(0)
    const panel = roundedPanel(this, -420, -44, 840, 88, palette.panel)
    const icon = this.add.text(-380, -12, '🌸', { fontSize: '24px' })
    const label = this.add.text(-340, -32, '阿筑', { fontFamily: UI_FONT, fontSize: '14px', color: '#b09a6e' })
    const body = this.add.text(-340, -10, LEVEL.azhuComment, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', wordWrap: { width: 740 } })
    box.add([panel, icon, label, body])

    this.tweens.add({
      targets: box, alpha: 1, y: 588, duration: 320,
      onComplete: () => {
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: box, alpha: 0, y: 620, duration: 320,
            onComplete: () => { box.destroy(); this.showSuccess() }
          })
        })
      }
    })
  }

  private showSuccess() {
    // 🌟 1. 标记通关
    LevelProgress.markCompleted(LEVEL.id)

    // 🌟 2. 发金币（拼图关没记录失误，直接算完美）
    const isPerfect = true 
    const reward = CoinSystem.rewardLevel(LEVEL.id, isPerfect)
    CoinSystem.showFloatText(this, reward)

    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.38).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, LEVEL.successTitle, { fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, LEVEL.successBody, { fontFamily: UI_FONT, fontSize: '18px', color: '#6a635b', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5, 0).setDepth(5002)
    
    textButton(this, 640, 460, '返回世界', () => { this.scene.start('WorldDetailScene', { worldId: 'dome-rock' }) }).setDepth(5002)
  }

  private showToast(msg: string) {
    const t = this.add.text(640, 160, msg, { fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f', backgroundColor: '#efe6d8ee', padding: { x: 14, y: 8 } }).setOrigin(0.5).setDepth(4000).setAlpha(0)
    this.tweens.add({
      targets: t, alpha: 1, y: 148, duration: 220, yoyo: true, hold: 1400,
      onComplete: () => t.destroy()
    })
  }
}