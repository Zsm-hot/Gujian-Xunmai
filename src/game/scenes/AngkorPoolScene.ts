import Phaser from 'phaser'
import { UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts' // 🌟 修复遗漏
import { angkorPoolLevel } from '../data/levels/angkor-pool.ts'

const LEVEL = angkorPoolLevel

const LANE_X = [460, 600, 740, 880]
const HIT_Y = 550

export class AngkorPoolScene extends Phaser.Scene {
  private overlayOpen = false
  private completed = false

  private waterLevels = [30, 70, 50, 20]
  private waterBars: Phaser.GameObjects.Graphics[] = []
  
  private missCount = 0
  private maxMiss = 5
  private survivalTime = 0 
  private timeText!: Phaser.GameObjects.Text 

  private fallingNodes: Phaser.GameObjects.Container[] = []

  private progressText!: Phaser.GameObjects.Text

  constructor() {
    super('AngkorPoolScene')
  }

  create() {
    this.overlayOpen = false
    this.completed = false
    this.missCount = 0
    this.survivalTime = 0

    this.timeText = this.add.text(1150, 40, '倒计时: 28s', { 
      fontFamily: UI_FONT, fontSize: '24px', color: '#8c2b2b', fontStyle: 'bold' 
    }).setOrigin(1, 0).setDepth(2001)
    
    this.fallingNodes = []
    this.waterLevels = [30, 70, 50, 20]

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      (this as any).playBeep = (type: string) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const freq = type === 'gold' ? 880 : (type === 'flood' ? 220 : 440);
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      };
    }
    this.paintBackground()
    this.buildHud()
    this.buildLanes()
    this.buildWaterBars()

    this.input.keyboard!.on('keydown-A', () => this.pressLane(0))
    this.input.keyboard!.on('keydown-S', () => this.pressLane(1))
    this.input.keyboard!.on('keydown-D', () => this.pressLane(2))
    this.input.keyboard!.on('keydown-F', () => this.pressLane(3))

    this.time.addEvent({
      delay: 800,
      callback: this.spawnNode,
      callbackScope: this,
      loop: true
    })
  }

  private paintBackground() {
    this.add.rectangle(640, 360, 1280, 720, 0x2d2a26, 1).setDepth(-10)
    const g = this.add.graphics().setDepth(-5)
    g.fillStyle(0x1a1816, 1)
    g.fillRect(420, 100, 440, 520)
    g.lineStyle(2, 0x4a463f, 1)
    LANE_X.forEach(x => {
      g.beginPath(); g.moveTo(x, 100); g.lineTo(x, 620); g.strokePath()
    })
  }

  private buildHud() {
    roundedPanel(this, 28, 24, 400, 92).setDepth(2000)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    this.add.text(48, 70, `A S D F 键点击金水，避开泥沙`, { fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354' }).setDepth(2001)

    this.progressText = this.add.text(1150, 100, `失误: 0 / ${this.maxMiss}`, { 
      fontFamily: UI_FONT, fontSize: '18px', color: '#8c2b2b', fontStyle: 'bold' 
    }).setOrigin(1, 0.5).setDepth(2001)

    textButton(this, 1150, 160, '重 来', () => { this.scene.restart() }).setDepth(2001)
  }

  private buildLanes() {
    LANE_X.forEach((x, i) => {
      this.add.text(x, 620, ['A', 'S', 'D', 'F'][i], {
        fontFamily: UI_FONT, fontSize: '24px', color: '#8898aa'
      }).setOrigin(0.5).setDepth(100)

      const ring = this.add.circle(x, HIT_Y, 30).setStrokeStyle(4, 0x8898aa, 0.5).setDepth(10)
      ring.setInteractive({ useHandCursor: true })
      ring.on('pointerdown', () => this.pressLane(i))
    })
  }

  private buildWaterBars() {
    const barX = [100, 220, 1060, 1180]
    barX.forEach((x, i) => {
      this.add.text(x, 600, `第${i + 1}池`, { fontFamily: UI_FONT, fontSize: '14px', color: '#e8dcc8' }).setOrigin(0.5).setDepth(10)
      const bg = this.add.rectangle(x, 350, 30, 400, 0x1a1816).setDepth(10)
      bg.setStrokeStyle(2, 0x4a463f)
      const levelG = this.add.graphics().setDepth(11)
      this.waterBars.push(levelG)
    })
    this.updateWaterBars()
  }

  private updateWaterBars() {
    const barX = [100, 220, 1060, 1180]
    this.waterBars.forEach((g, i) => {
      g.clear()
      const val = this.waterLevels[i]
      const h = (val / 100) * 400
      const y = 350 + 200 - h
      
      let color = 0xd4a338
      if (val > 80) color = 0x8c2b2b
      if (val < 20) color = 0x4a463f

      g.fillStyle(color, 0.8)
      g.fillRect(barX[i] - 13, y, 26, h)
    })
  }

  private spawnNode() {
    if (this.completed) return
    const lane = Phaser.Math.Between(0, 3)
    const rand = Math.random()
    let type = 'gold'
    let color = 0xd4a338
    let size = 24
    
    if (rand > 0.85) { type = 'sand'; color = 0x4a463f; size = 30 }
    else if (rand > 0.7) { type = 'flood'; color = 0x8c2b2b; size = 28 }

    const container = this.add.container(LANE_X[lane], 100).setDepth(50)
    const g = this.add.graphics()
    
    g.fillStyle(color, 1)
    if (type === 'sand') {
      g.fillRect(-size/2, -size/2, size, size)
    } else {
      g.fillCircle(0, 0, size/2)
    }
    
    container.add(g)
    container.setData('type', type)
    container.setData('lane', lane)
    
    this.fallingNodes.push(container)
  }

  private pressLane(lane: number) {
    if (this.completed) return
    
    let closestNode: Phaser.GameObjects.Container | null = null
    let minDist = 999

    this.fallingNodes.forEach(node => {
      if (node.getData('lane') === lane) {
        const dist = Math.abs(node.y - HIT_Y)
        if (dist < minDist) {
          minDist = dist
          closestNode = node
        }
      }
    })

    if (closestNode && minDist < 40) {
      const nodeToHit = closestNode as Phaser.GameObjects.Container
      const type = nodeToHit.getData('type')
      this.handleHit(type, lane)
      
      this.fallingNodes = this.fallingNodes.filter(n => n !== nodeToHit)
      nodeToHit.destroy()
    }
  }

  private handleHit(type: string, lane: number) {
    if (type === 'gold') {
      this.waterLevels[lane] = Math.min(100, this.waterLevels[lane] + 15)
      this.updateWaterBars()
      this.cameras.main.flash(100, 255, 215, 0, false)
      this.checkWin()
    } 
    else if (type === 'flood') {
      this.waterLevels[lane] = Math.min(100, this.waterLevels[lane] + 40)
      this.updateWaterBars()
      this.cameras.main.shake(200, 0.02)
      this.showToast('暴洪涌入！水位失衡！')
    } 
    else if (type === 'sand') {
      this.waterLevels[lane] = Math.max(0, this.waterLevels[lane] - 30)
      this.updateWaterBars()
      this.cameras.main.shake(200, 0.01)
      this.showToast('泥沙堵塞，水量下降！')
    }
  }

  update(_time: number, delta: number) {
    if (this.completed) return

    this.fallingNodes.forEach(node => {
      node.y += (300 * delta) / 1000
    })

    for (let i = this.fallingNodes.length - 1; i >= 0; i--) {
      const node = this.fallingNodes[i]
      
      if (node && !node.getData('playedSound') && node.y >= HIT_Y - 40 && node.y <= HIT_Y + 30) {
        node.setData('playedSound', true)
        if ((this as any).playBeep) (this as any).playBeep(node.getData('type'))
        this.flashHitArea()
      }

      if (node && node.y > HIT_Y + 40) {
        if (node.getData('type') === 'gold') {
          this.addMiss()
        }
        node.destroy()
        this.fallingNodes.splice(i, 1)
      }
    }

    this.survivalTime += delta / 1000
    this.timeText.setText(`倒计时: ${Math.ceil(28 - this.survivalTime)}s`)
    if (this.survivalTime > 28 && !this.completed) {
      this.completeLevel()
    }
  }

  private addMiss() {
    this.missCount++
    this.progressText.setText(`失误: ${this.missCount} / ${this.maxMiss}`)
    this.cameras.main.flash(200, 255, 0, 0, false)
    
    if (this.missCount >= this.maxMiss) {
      this.gameOver('失误太多，圣池干涸！')
    }
  }

  private checkWin() {
    const allFull = this.waterLevels.every(v => v > 80)
    if (allFull && !this.completed) {
      this.completeLevel()
    }
  }

  private gameOver(reason: string) {
    if (this.completed) return
    this.completed = true

    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, '灌溉失败', { fontFamily: UI_FONT, fontSize: '32px', color: '#8c2b2b' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, reason, { fontFamily: UI_FONT, fontSize: '18px', color: '#e8dcc8' }).setOrigin(0.5).setDepth(5002)
    textButton(this, 640, 460, '重新挑战', () => { this.scene.restart() }).setDepth(5002)
    textButton(this, 640, 520, '放弃并返回', () => { this.scene.start('WorldDetailScene', { worldId: 'angkor' }) }).setDepth(5002)
  }

  private completeLevel() {
    if (this.completed) return
    this.completed = true
    this.cameras.main.flash(1500, 255, 255, 255)

    this.time.delayedCall(1000, () => {
      if (this.overlayOpen) return
      this.overlayOpen = true
      showKnowledgeCard(this, LEVEL.knowledgeCard, () => this.showSuccess())
    })
  }

  private showSuccess() {
    // 🌟 标记通关
    LevelProgress.markCompleted(LEVEL.id)

    // 🌟 完美通关判定：一次都没漏接（missCount === 0）
    const isPerfect = this.missCount === 0
    const reward = CoinSystem.rewardLevel(LEVEL.id, isPerfect)
    CoinSystem.showFloatText(this, reward)

    // 渲染成功面板
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, LEVEL.successTitle, { fontFamily: UI_FONT, fontSize: '32px', color: '#d4a338' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, LEVEL.successBody, { fontFamily: UI_FONT, fontSize: '18px', color: '#e8dcc8', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5, 0).setDepth(5002)
    
    textButton(this, 640, 460, '返回世界', () => { this.scene.start('WorldDetailScene', { worldId: 'angkor' }) }).setDepth(5002)
  }

  private showToast(msg: string) {
    const t = this.add.text(640, 200, msg, { fontFamily: UI_FONT, fontSize: '16px', color: '#e8dcc8', backgroundColor: '#3d3a34ee', padding: { x: 14, y: 8 } }).setOrigin(0.5).setDepth(4000).setAlpha(0)
    this.tweens.add({ targets: t, alpha: 1, y: 180, duration: 200, yoyo: true, hold: 1000, onComplete: () => t.destroy() })
  }

  private flashHitArea() {
    const flash = this.add.rectangle(640, HIT_Y, 600, 60, 0xffffff, 0.2).setDepth(5)
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy()
    })
  }
}