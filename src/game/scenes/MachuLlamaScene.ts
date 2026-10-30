
import Phaser from 'phaser'
import { UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { machuLlamaLevel } from '../data/levels/machu-llama.ts'
import { worlds } from '../data/worlds.ts' // 🌟 引入 worlds 用于判定全通关
import { CoinSystem } from '../systems/CoinSystem.ts'

const LEVEL = machuLlamaLevel

type Stage = 'FENCE' | 'FEED' | 'SIMULATE'

interface Alpaca {
  container: Phaser.GameObjects.Container
  speed: number
  targetX: number
  targetY: number
  isPanicking: boolean
}

interface GrassSpot {
  x: number
  y: number
  hasGrass: boolean
  visual: Phaser.GameObjects.Arc
}

export class MachuLlamaScene extends Phaser.Scene {
  private overlayOpen = false
  private completed = false

  private stage: Stage = 'FENCE'
  private hudText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text

  private terraceTop = 200
  private terraceMid = 400
  private terraceBot = 600

  private alpacas: Alpaca[] = []
  
  private gapsBlocked = [false, false, false]
  private gapPositions = [200, 640, 1080]

  private grassSpots: GrassSpot[] = []
  private simTimer = 0

  private lastPanicTime = 0
  private panicCooldown = 2500

  constructor() {
    super('MachuLlamaScene')
  }

  create() {
    this.overlayOpen = false
    this.completed = false
    this.stage = 'FENCE'
    this.alpacas = []
    this.gapsBlocked = [false, false, false]
    this.grassSpots = []
    this.simTimer = 0
    this.lastPanicTime = 0

    this.drawTerraces()
    this.buildHud()
    this.createRopeGaps()
    this.createGrassSpots()
    this.spawnAlpacas(15)

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (this.completed || this.stage !== 'SIMULATE') return
      if (currentlyOver.length > 0) return 
      
      this.alpacas.forEach(alpaca => {
        const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, alpaca.container.x, alpaca.container.y)
        if (dist < 70) { 
          if (alpaca.isPanicking) {
            alpaca.isPanicking = false 
            
            const safeY = Phaser.Math.Between(this.terraceMid, this.terraceMid + 100)
            const safeX = Phaser.Math.Between(200, 1000)
            
            this.tweens.add({
              targets: alpaca.container,
              x: safeX, y: safeY, duration: 300, ease: 'Back.easeOut',
              onComplete: () => { alpaca.targetX = safeX; alpaca.targetY = safeY }
            })

            this.showFloatText(alpaca.container.x, alpaca.container.y, '回去！', '#4a90e2')
          }
        }
      })
    })
  }

  private drawTerraces() {
    this.add.rectangle(640, 360, 1280, 720, 0x1a2b24, 1).setDepth(-10)
    const g = this.add.graphics().setDepth(-5)
    g.fillStyle(0x526b31, 1); g.fillRect(0, this.terraceTop, 1280, 180)
    g.fillStyle(0x607a3a, 1); g.fillRect(0, this.terraceMid, 1280, 180)
    g.fillStyle(0x4a5a45, 1); g.fillRect(0, this.terraceBot, 1280, 120)
    g.fillStyle(0x0d1712, 1); g.fillRect(0, 680, 1280, 40)
    
    g.lineStyle(4, 0x8a8a7a, 1)
    g.beginPath(); g.moveTo(0, this.terraceTop + 180); g.lineTo(1280, this.terraceTop + 180); g.strokePath()
    g.beginPath(); g.moveTo(0, this.terraceMid + 180); g.lineTo(1280, this.terraceMid + 180); g.strokePath()
  }

  private buildHud() {
    roundedPanel(this, 28, 24, 480, 110).setDepth(2000)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    
    this.hudText = this.add.text(48, 70, '阶段1：按住并拖拽红色的绳索两端，把缺口拉直封死', { 
      fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354' 
    }).setDepth(2001)

    this.timerText = this.add.text(1150, 40, '', { 
      fontFamily: UI_FONT, fontSize: '24px', color: '#8c2b2b', fontStyle: 'bold' 
    }).setOrigin(1, 0).setDepth(2001)
  }

  private createRopeGaps() {
    this.gapPositions.forEach((x, i) => {
      const targetY = this.terraceBot + 20
      const ropeG = this.add.graphics().setDepth(20)
      
      ropeG.lineStyle(6, 0x8c2b2b, 1)
      ropeG.beginPath()
      ropeG.moveTo(x - 40, targetY + 20); ropeG.lineTo(x - 20, targetY + 30)
      ropeG.moveTo(x + 20, targetY + 30); ropeG.lineTo(x + 40, targetY + 20)
      ropeG.strokePath()

      const hitZone = this.add.zone(x, targetY, 100, 60).setInteractive({ useHandCursor: true })
      hitZone.setData('fixed', false)

      hitZone.on('pointerdown', () => {
        if (this.stage !== 'FENCE' || hitZone.getData('fixed')) return
        ropeG.clear()
        ropeG.lineStyle(6, 0xffd700, 1)
        ropeG.beginPath()
        ropeG.moveTo(x - 40, targetY + 20); ropeG.lineTo(x - 15, targetY - 10)
        ropeG.moveTo(x + 15, targetY - 10); ropeG.lineTo(x + 40, targetY + 20)
        ropeG.strokePath()
      })

      hitZone.on('pointerup', () => {
        if (this.stage !== 'FENCE' || hitZone.getData('fixed')) return
        hitZone.setData('fixed', true)
        hitZone.disableInteractive()
        ropeG.clear()
        ropeG.lineStyle(6, 0xff0000, 1)
        ropeG.beginPath(); ropeG.moveTo(x - 50, targetY); ropeG.lineTo(x + 50, targetY); ropeG.strokePath()

        this.gapsBlocked[i] = true
        this.showFloatText(x, targetY - 30, '封锁！', '#5a8a4a')

        if (this.gapsBlocked.every(b => b)) {
          this.time.delayedCall(500, () => this.startStage2())
        }
      })
    })
  }

  private createGrassSpots() {
    const spots = [
      { x: 300, y: 300 }, { x: 800, y: 300 },
      { x: 200, y: 500 }, { x: 640, y: 500 }, { x: 1000, y: 500 }
    ]

    spots.forEach(pos => {
      const visual = this.add.circle(pos.x, pos.y, 25, 0x5a6a4a, 1).setDepth(15)
      visual.setStrokeStyle(2, 0x3a4a3a, 1)
      
      const hit = this.add.zone(pos.x, pos.y, 50, 50).setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => {
        if (this.stage !== 'FEED') return
        const spot = this.grassSpots.find(s => s.x === pos.x && s.y === pos.y)
        if (spot && !spot.hasGrass) {
          spot.hasGrass = true
          spot.visual.setFillStyle(0xffd700, 1)
          this.showFloatText(pos.x, pos.y - 30, '投喂！', '#d4a338')
          if (this.grassSpots.every(s => s.hasGrass)) {
            this.startStage3()
          }
        }
      })
      this.grassSpots.push({ x: pos.x, y: pos.y, hasGrass: false, visual })
    })
  }

  private startStage2() {
    this.stage = 'FEED'
    this.hudText.setText('阶段2：点击空草槽，填满所有 5 个草料槽')
  }

  private startStage3() {
    this.stage = 'SIMULATE'
    this.hudText.setText('阶段3：30秒动态值守！随时留意向下冲的羊驼！')
    this.simTimer = 30

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.completed) return
        this.simTimer--
        this.timerText.setText(`倒计时: ${this.simTimer}s`)
        if (this.simTimer <= 0) this.completeLevel()
      },
      loop: true
    })
  }

  private spawnAlpacas(count: number) {
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(100, 1180)
      const y = Phaser.Math.Between(this.terraceTop + 50, this.terraceMid + 100)
      
      const container = this.add.container(x, y).setDepth(50)
      const g = this.add.graphics()
      g.fillStyle(0xffffff, 1)
      g.fillRect(-12, 0, 24, 30)
      g.fillRect(-5, -20, 10, 20)
      g.fillCircle(0, -25, 8)
      g.fillTriangle(-5, -30, -10, -38, 0, -30)
      g.fillTriangle(5, -30, 10, -38, 0, -30)
      g.fillStyle(0x333333, 1)
      g.fillCircle(-3, -26, 1.5)
      g.fillCircle(3, -26, 1.5)
      container.add(g)

      this.alpacas.push({
        container,
        speed: Phaser.Math.FloatBetween(60, 90),
        targetX: x,
        targetY: y,
        isPanicking: false
      })
    }
  }

  update(time: number, delta: number) {
    if (this.completed) return

    this.alpacas.forEach(alpaca => {
      const moveSpeed = (alpaca.speed * delta) / 1000

      if (this.stage === 'SIMULATE' && !alpaca.isPanicking) {
        if (time - this.lastPanicTime > this.panicCooldown) {
          if (Math.random() < 0.01) {
            alpaca.isPanicking = true
            alpaca.targetX = this.gapPositions[Phaser.Math.Between(0, 2)]
            alpaca.targetY = this.terraceBot + 80
            this.lastPanicTime = time
            this.showFloatText(alpaca.container.x, alpaca.container.y - 40, '⚠️', '#ff0000')
          }
        }
      }

      if (alpaca.isPanicking) {
        const angle = Phaser.Math.Angle.Between(alpaca.container.x, alpaca.container.y, alpaca.targetX, alpaca.targetY)
        alpaca.container.x += Math.cos(angle) * moveSpeed * 1.5
        alpaca.container.y += Math.sin(angle) * moveSpeed * 1.5
      } else {
        if (Phaser.Math.Distance.Between(alpaca.container.x, alpaca.container.y, alpaca.targetX, alpaca.targetY) < 20) {
          const availableGrass = this.grassSpots.filter(s => s.hasGrass)
          if (availableGrass.length > 0) {
            const food = Phaser.Utils.Array.GetRandom(availableGrass)
            alpaca.targetX = food.x + Phaser.Math.Between(-30, 30)
            alpaca.targetY = food.y + Phaser.Math.Between(-30, 30)
          } else {
            alpaca.targetX = Phaser.Math.Between(100, 1180)
            alpaca.targetY = Phaser.Math.Between(this.terraceTop + 50, this.terraceMid + 100)
          }
        }
        const angle = Phaser.Math.Angle.Between(alpaca.container.x, alpaca.container.y, alpaca.targetX, alpaca.targetY)
        alpaca.container.x += Math.cos(angle) * moveSpeed
        alpaca.container.y += Math.sin(angle) * moveSpeed
      }

      if (this.stage === 'SIMULATE') {
        if (alpaca.container.y > this.terraceBot + 30) {
          this.gameOver('一只羊驼坠入了万丈深渊！')
        }
      } else {
        alpaca.container.y = Phaser.Math.Clamp(alpaca.container.y, this.terraceTop, this.terraceBot - 20)
      }
    })
  }

  private showFloatText(x: number, y: number, text: string, color: string) {
    const t = this.add.text(x, y, text, { 
      fontFamily: UI_FONT, fontSize: '18px', color: color, fontStyle: 'bold' 
    }).setOrigin(0.5).setDepth(1000).setAlpha(0)
    this.tweens.add({ targets: t, y: y - 30, alpha: 1, duration: 500, yoyo: true, hold: 300, onComplete: () => t.destroy() })
  }

  private completeLevel() {
    if (this.completed) return
    this.completed = true
    
    this.time.delayedCall(1000, () => {
      if (this.overlayOpen) return
      this.overlayOpen = true
      showKnowledgeCard(this, LEVEL.knowledgeCard, () => this.showSuccess())
    })
  }

  private gameOver(reason: string) {
    if (this.completed) return
    this.completed = true
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, '牧场失控', { fontFamily: UI_FONT, fontSize: '32px', color: '#8c2b2b' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, reason, { fontFamily: UI_FONT, fontSize: '18px', color: '#e8dcc8' }).setOrigin(0.5).setDepth(5002)
    textButton(this, 640, 460, '重新挑战', () => { this.scene.restart() }).setDepth(5002)
    textButton(this, 640, 520, '放弃并返回', () => { this.scene.start('WorldDetailScene', { worldId: 'machu-picchu' }) }).setDepth(5002)
  }

  // ===== 成功面板与明信片 =====
    private showSuccess() {
    LevelProgress.markCompleted(LEVEL.id)
    
    const isPerfect = true 
    const reward = CoinSystem.rewardLevel(LEVEL.id, isPerfect)
    CoinSystem.showFloatText(this, reward)

    const currentWorld = worlds.find(w => w.id === 'machu-picchu')
    if (currentWorld && currentWorld.levels) {
      const allCompleted = currentWorld.levels.every(lv => LevelProgress.isCompleted(lv.id))
      if (allCompleted) {
        import('../ui/CatPostcardUI').then(module => {
          module.showCatPostcard(this, 'machu-picchu')
        })
      }
    }

    const allWorldsClear = worlds.every(w => 
      w.levels?.every(lv => LevelProgress.isCompleted(lv.id))
    )

    if (allWorldsClear) {
      this.cameras.main.flash(2000, 255, 255, 255)
      this.time.delayedCall(2500, () => {
        this.scene.start('EndingScene')
      })
    } else {
      this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6).setDepth(5000)
      roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
      
      this.add.text(640, 230, LEVEL.successTitle, { 
        fontFamily: UI_FONT, fontSize: '32px', color: '#d4a338' 
      }).setOrigin(0.5).setDepth(5002)
      
      this.add.text(640, 300, LEVEL.successBody, { 
        fontFamily: UI_FONT, fontSize: '18px', color: '#e8dcc8', wordWrap: { width: 560 }, align: 'center' 
      }).setOrigin(0.5, 0).setDepth(5002)
      
      textButton(this, 640, 460, '返回世界', () => { 
        this.scene.start('WorldDetailScene', { worldId: 'machu-picchu' }) 
      }).setDepth(5002)
    }
  } // 👈 只需要这一个括号结束
} // 👈 这是类的结束