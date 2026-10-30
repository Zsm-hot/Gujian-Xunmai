import Phaser from 'phaser'
import { UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { machuSpotLevel } from '../data/levels/machu-spot.ts'

const LEVEL = machuSpotLevel

export class MachuSpotScene extends Phaser.Scene {
  private overlayOpen = false
  private completed = false
  private foundCount = 0

  private hazards = [
    { id: 1, x: 350, y: 280, r: 35, found: false, name: '岩层裂隙' },
    { id: 2, x: 850, y: 420, r: 45, found: false, name: '松散坡土' },
    { id: 3, x: 650, y: 220, r: 30, found: false, name: '堵塞暗渠' },
    { id: 4, x: 450, y: 550, r: 40, found: false, name: '危险坡面' },
  ]

  private hudText!: Phaser.GameObjects.Text
  private hazardTexts: Map<number, Phaser.GameObjects.Text> = new Map()
  
  // 存放所有灰尘颗粒的数组
  private dustParticles: Phaser.GameObjects.Arc[] = []

  constructor() {
    super('MachuSpotScene')
  }

  create() {
    this.overlayOpen = false
    this.completed = false
    this.foundCount = 0
    this.hazards.forEach(h => h.found = false)
    this.hazardTexts.clear()
    this.dustParticles = []

    // 1. 画背景地形
    this.drawMachuTerraces()
    
    // 2. 画裂缝（藏在底下）
    this.buildHazards()
    
    // 3. 画灰尘颗粒（盖在最上面）
    this.createDustParticles()

    // 4. UI
    this.buildHud()

    // 🌟 核心玩法：按住鼠标滑动，清除周围的灰尘
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.completed) return
      if (!pointer.isDown) return 
      
      this.eraseDust(pointer.x, pointer.y)
    })

    // 点击判定
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.completed) return
      this.hazards.forEach(h => {
        if (h.found) return
        const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, h.x, h.y)
        if (dist < h.r + 20) {
          this.foundHazard(h.id)
        }
      })
    })
  }

  private drawMachuTerraces() {
    const sky = this.add.graphics().setDepth(-10)
    sky.fillGradientStyle(0x1a2b24, 0x1a2b24, 0x0d1712, 0x0d1712, 1)
    sky.fillRect(0, 0, 1280, 720)

    const terrain = this.add.graphics().setDepth(-9)
    const terraceCount = 6
    const startY = 180
    const terraceHeight = 90

    for (let i = 0; i < terraceCount; i++) {
      const y = startY + i * terraceHeight
      const grassColor = i % 2 === 0 ? 0x607a3a : 0x526b31
      terrain.fillStyle(grassColor, 1)
      terrain.fillRect(0, y, 1280, terraceHeight)

      terrain.fillStyle(0x7a6b53, 0.4)
      for (let j = 0; j < 8; j++) {
        const sx = Phaser.Math.Between(0, 1280)
        const sy = y + Phaser.Math.Between(10, terraceHeight - 30)
        terrain.fillCircle(sx, sy, Phaser.Math.Between(10, 30))
      }

      terrain.fillStyle(0x55554a, 1)
      terrain.fillRect(0, y + terraceHeight - 25, 1280, 25)
      terrain.lineStyle(1, 0x33332a, 0.6)
      for (let x = 0; x < 1280; x += 60) {
        terrain.strokeRect(x, y + terraceHeight - 25, 60, 25)
      }
      terrain.fillStyle(0x000000, 0.4)
      terrain.fillRect(0, y + terraceHeight, 1280, 15)
    }
  }

  private buildHazards() {
    this.hazards.forEach(h => {
      const g = this.add.graphics().setDepth(10)
      g.lineStyle(4, 0x000000, 0.5)
      g.beginPath(); g.moveTo(h.x - h.r, h.y - h.r); g.lineTo(h.x, h.y); g.lineTo(h.x + h.r * 0.8, h.y + h.r); g.strokePath()
      g.lineStyle(2, 0x2d2215, 1)
      g.beginPath(); g.moveTo(h.x - h.r, h.y - h.r); g.lineTo(h.x, h.y); g.lineTo(h.x + h.r * 0.8, h.y + h.r); g.strokePath()
      g.beginPath(); g.moveTo(h.x, h.y); g.lineTo(h.x + h.r * 0.6, h.y - h.r * 0.5); g.strokePath()

      const txt = this.add.text(h.x, h.y - h.r - 10, `✓ ${h.name}`, {
        fontFamily: UI_FONT, fontSize: '14px', color: '#ffffff', backgroundColor: '#3d3a34ee', padding: { x: 6, y: 2 }
      }).setOrigin(0.5).setDepth(30).setVisible(false)
      
      this.hazardTexts.set(h.id, txt)
    })
  }

  // 🌟 铺满屏幕的灰尘颗粒
  private createDustParticles() {
    // 为了性能，我们不用一万个小点，用稍微大一点的半透明圆拼凑
    for (let i = 0; i < 800; i++) {
      const x = Phaser.Math.Between(0, 1280)
      const y = Phaser.Math.Between(0, 720)
      const color = Math.random() > 0.5 ? 0x8a8a7a : 0x9a9a8a
      
      // 创建一个灰尘圆点，深度为 50
      const p = this.add.circle(x, y, Phaser.Math.Between(30, 60), color, 1).setDepth(50)
      this.dustParticles.push(p)
    }
  }

  // 🌟 擦除逻辑：遍历灰尘，如果鼠标在它附近，就把它隐藏
  private eraseDust(mouseX: number, mouseY: number) {
    const brushRadius = 60 // 笔刷大小

    this.dustParticles.forEach(p => {
      if (!p.visible) return
      
      const dist = Phaser.Math.Distance.Between(mouseX, mouseY, p.x, p.y)
      // 如果鼠标靠得很近，把它藏起来（假装被擦掉了）
      if (dist < brushRadius + p.radius) {
        p.setVisible(false)
      }
    })
  }

  private foundHazard(id: number) {
    const hazard = this.hazards.find(h => h.id === id)
    if (!hazard || hazard.found) return

    hazard.found = true
    this.foundCount++

    const g = this.add.graphics().setDepth(60)
    g.lineStyle(3, 0x8bc34a, 1)
    g.strokeCircle(hazard.x, hazard.y, hazard.r)
    
    const txt = this.hazardTexts.get(id)
    if (txt) txt.setVisible(true)

    this.cameras.main.flash(200, 100, 255, 100, false)
    
    if (this.foundCount >= this.hazards.length) {
      this.completeLevel()
    }
  }

  private buildHud() {
    roundedPanel(this, 28, 24, 400, 92).setDepth(2000)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    
    this.hudText = this.add.text(48, 70, '按住鼠标滑动擦去灰尘，点击裂缝排查', { 
      fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354' 
    }).setDepth(2001)

    textButton(this, 1150, 100, '重 来', () => { this.scene.restart() }).setDepth(2001)
  }

  private completeLevel() {
    if (this.completed) return
    this.completed = true

    this.hudText.setText('隐患排查完毕！')
    
    this.time.delayedCall(500, () => {
      if (this.overlayOpen) return
      this.overlayOpen = true
      showKnowledgeCard(this, LEVEL.knowledgeCard, () => this.showSuccess())
    })
  }

  private showSuccess() {
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.5).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    
    this.add.text(640, 230, LEVEL.successTitle, { fontFamily: UI_FONT, fontSize: '32px', color: '#d4a338' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, LEVEL.successBody, { fontFamily: UI_FONT, fontSize: '18px', color: '#e8dcc8', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5, 0).setDepth(5002)

    LevelProgress.markCompleted(LEVEL.id)
    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'machu-picchu' })
    }).setDepth(5002)
  }
}