import { showCatPostcard } from '../ui/CatPostcardUI.ts'
import Phaser from 'phaser'
import { UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts'
import { angkorBoatLevel } from '../data/levels/angkor-boat.ts'

const LEVEL = angkorBoatLevel
const SHIP_SPEED = 120 
const MAX_DISTANCE = 3000

interface Obstacle {
  x: number
  y: number
  graphics: Phaser.GameObjects.Graphics
}

export class AngkorBoatScene extends Phaser.Scene {
  private completed = false
  private ship!: Phaser.GameObjects.Container
  private targetX = 640 
  
  private distance = 0 
  private lives = 3
  private obstacleList: Obstacle[] = []
  
  private progressText!: Phaser.GameObjects.Text
  private progressBarFill!: Phaser.GameObjects.Rectangle
  private lifeText!: Phaser.GameObjects.Text

  constructor() {
    super('AngkorBoatScene')
  }

  create() {
    this.completed = false
    this.distance = 0
    this.lives = 3
    this.targetX = 640
    this.obstacleList = []

    this.add.rectangle(640, 360, 1280, 720, 0x0a1c2a).setDepth(-10)
    
    const waves = this.add.graphics().setDepth(-5)
    waves.lineStyle(1, 0x1a3c5a, 0.3)
    for (let i = 0; i < 30; i++) {
      waves.beginPath(); waves.moveTo(0, i * 40); waves.lineTo(1280, i * 40 + 30); waves.strokePath()
    }

    this.ship = this.add.container(640, 600).setDepth(100)
    const shipG = this.add.graphics()
    shipG.fillStyle(0x7a5230, 1); shipG.fillEllipse(0, 0, 60, 120) 
    shipG.lineStyle(3, 0x3a2010, 1); shipG.strokeEllipse(0, 0, 60, 120)
    shipG.fillStyle(0x5a3a1a, 1); shipG.fillRect(-20, -20, 40, 40)
    shipG.lineStyle(4, 0xb8894a, 1); shipG.beginPath(); shipG.moveTo(-40, 20); shipG.lineTo(40, -20); shipG.strokePath()
    shipG.fillStyle(0xb8894a, 1); shipG.fillEllipse(-40, 20, 20, 10); shipG.fillEllipse(40, -20, 20, 10)
    this.ship.add(shipG)

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.targetX = Phaser.Math.Clamp(pointer.x, 100, 1180)
    })

    this.buildHud()

    this.time.addEvent({
      delay: 500, 
      callback: this.spawnObstacles,
      callbackScope: this,
      loop: true
    })
  }

  private buildHud() {
    roundedPanel(this, 28, 24, 400, 92).setDepth(2000)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    this.add.text(48, 70, '左右移动鼠标驾驶小船，避开暗桩', { fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354' }).setDepth(2001)

    this.add.rectangle(640, 680, 600, 10, 0x33332a).setDepth(2000)
    this.progressBarFill = this.add.rectangle(340, 680, 0, 8, 0xd4a338).setDepth(2001).setOrigin(0, 0.5)
    this.progressText = this.add.text(640, 700, `进度: 0 / ${MAX_DISTANCE}`, { fontFamily: UI_FONT, fontSize: '14px', color: '#e8dcc8' }).setOrigin(0.5).setDepth(2001)
    
    this.lifeText = this.add.text(1150, 40, `生命: ❤️❤️❤️`, { fontFamily: UI_FONT, fontSize: '20px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(1, 0).setDepth(2001)
  }

  update(_time: number, delta: number) {
    if (this.completed) return

    this.distance += (SHIP_SPEED * delta) / 1000
    const progress = Math.min(this.distance / MAX_DISTANCE, 1)
    this.progressBarFill.width = 600 * progress
    this.progressText.setText(`进度: ${Math.floor(this.distance)} / ${MAX_DISTANCE}`)

    this.ship.x = Phaser.Math.Linear(this.ship.x, this.targetX, 0.1)
    const tilt = (this.targetX - this.ship.x) * 0.002
    this.ship.setRotation(Phaser.Math.Clamp(tilt, -0.3, 0.3))

    for (let i = this.obstacleList.length - 1; i >= 0; i--) {
      const obs = this.obstacleList[i]
      obs.y -= (SHIP_SPEED * delta) / 1000
      obs.graphics.y = obs.y
      
      if (obs.y < -150) {
        obs.graphics.destroy()
        this.obstacleList.splice(i, 1)
        continue
      }

      const dist = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, obs.x, obs.y)
      if (dist < 60) { 
        obs.graphics.destroy()
        this.obstacleList.splice(i, 1)
        
        this.lives--
        this.lifeText.setText(`生命: ${'❤️'.repeat(Math.max(0, this.lives))}${'🖤'.repeat(3 - Math.max(0, this.lives))}`)
        this.cameras.main.shake(300, 0.05)
        this.cameras.main.flash(300, 255, 0, 0, false)
        
        if (this.lives <= 0) this.gameOver('木船触礁沉没！')
      }
    }

    if (this.distance >= MAX_DISTANCE) this.completeLevel()
  }

  private spawnObstacles() {
    if (this.completed) return
    const x = Phaser.Math.Between(100, 1180)
    
    const g = this.add.graphics().setDepth(50)
    g.x = x
    g.y = -150
    
    g.fillStyle(0x4a3a2a, 1); g.fillCircle(0, 0, 40) 
    g.lineStyle(6, 0xff0000, 1); g.strokeCircle(0, 0, 45) 
    g.lineStyle(3, 0x1a0a00, 1) 
    g.beginPath(); g.moveTo(-20, -20); g.lineTo(20, 20); g.strokePath()
    g.beginPath(); g.moveTo(20, -20); g.lineTo(-20, 20); g.strokePath()
    
    this.obstacleList.push({ x, y: -150, graphics: g })
  }

  private completeLevel() {
    if (this.completed) return
    this.completed = true

    LevelProgress.markCompleted(LEVEL.id)
    
    const isPerfect = this.lives === 3
    const reward = CoinSystem.rewardLevel(LEVEL.id, isPerfect)
    CoinSystem.showFloatText(this, reward)

    showCatPostcard(this, 'angkor')

    showKnowledgeCard(this, LEVEL.knowledgeCard, () => {
      this.scene.start('WorldDetailScene', { worldId: 'angkor' })
    })
  }

  private gameOver(reason: string) {
    if (this.completed) return
    this.completed = true

    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8).setDepth(5000)
    this.add.text(640, 300, '迷失在迷雾中: ' + reason, { fontSize: '32px', color: '#ff0000' }).setOrigin(0.5).setDepth(5002)
    textButton(this, 640, 460, '重新挑战', () => { this.scene.restart() }).setDepth(5002)
    textButton(this, 640, 520, '放弃并返回', () => { this.scene.start('WorldDetailScene', { worldId: 'angkor' }) }).setDepth(5002)
  }
}