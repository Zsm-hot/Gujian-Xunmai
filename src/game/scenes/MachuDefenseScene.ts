import Phaser from 'phaser'
import { UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { machuDefenseLevel } from '../data/levels/machu-defense.ts'

const LEVEL = machuDefenseLevel

const LANE_X = [400, 640, 880]
const ENEMY_SPEED = 120 // 🌟 稍微降低速度，给玩家反应时间

export class MachuDefenseScene extends Phaser.Scene {
  private overlayOpen = false
  private completed = false

  private score = 0
  private enemies: Phaser.GameObjects.Container[] = []
  private spawnTimer!: Phaser.Time.TimerEvent
  private remainingTime = 40 

  private hudText!: Phaser.GameObjects.Text
  private timeText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  
  private cooldowns = [0, 0, 0] 
  private keyMap: Record<string, number> = { A: 0, S: 1, D: 2 }

  constructor() {
    super('MachuDefenseScene')
  }

  create() {
    this.overlayOpen = false
    this.completed = false
    this.score = 0
    this.enemies = []
    this.remainingTime = 40
    this.cooldowns = [0, 0, 0]

    this.drawDefenseBackground()
    this.buildHud()
    this.buildDefenseButtons()

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.completed) return
        this.remainingTime--
        this.timeText.setText(`倒计时: ${this.remainingTime}s`)
        
        if (this.remainingTime <= 0) {
          this.completeLevel()
        }
      },
      loop: true
    })

    // 生成频率稍微放慢一点点
    this.spawnTimer = this.time.addEvent({
      delay: 700, 
      callback: this.spawnEnemyWave,
      callbackScope: this,
      loop: true
    })

    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      const lane = this.keyMap[event.key.toUpperCase()]
      if (lane !== undefined) {
        this.triggerTrap(lane)
      }
    })
  }

  private drawDefenseBackground() {
    this.add.rectangle(640, 360, 1280, 720, 0x1a2b24, 1).setDepth(-10)
    const g = this.add.graphics().setDepth(-5)
    
    LANE_X.forEach(x => {
      g.fillStyle(0x4a5a45, 0.5)
      g.fillRect(x - 40, 0, 80, 720)
      g.lineStyle(2, 0x6a7a60, 0.8)
      g.beginPath(); g.moveTo(x - 40, 0); g.lineTo(x - 40, 720); g.strokePath()
      g.beginPath(); g.moveTo(x + 40, 0); g.lineTo(x + 40, 720); g.strokePath()
    })

    const cityGate = this.add.graphics().setDepth(0)
    cityGate.fillStyle(0x8a8a7a, 1)
    cityGate.fillRect(0, 650, 1280, 70)
  }

  private buildHud() {
    roundedPanel(this, 28, 24, 400, 92).setDepth(2000)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    
    this.hudText = this.add.text(48, 70, '按 A/S/D 或点击机关。⚠️切勿攻击蓝衣平民！', { 
      fontFamily: UI_FONT, fontSize: '14px', color: '#8c2b2b', fontStyle: 'bold'
    }).setDepth(2001)

    this.timeText = this.add.text(1150, 40, `倒计时: 40s`, { 
      fontFamily: UI_FONT, fontSize: '24px', color: '#8c2b2b', fontStyle: 'bold' 
    }).setOrigin(1, 0).setDepth(2001)

    this.scoreText = this.add.text(1150, 80, `拦截: 0`, { 
      fontFamily: UI_FONT, fontSize: '18px', color: '#5a8a4a' 
    }).setOrigin(1, 0).setDepth(2001)
  }

  private buildDefenseButtons() {
    LANE_X.forEach((x, i) => {
      const btn = this.add.rectangle(x, 680, 120, 50, 0x55554a)
        .setInteractive({ useHandCursor: true })
        .setDepth(100)
      
      const btnText = this.add.text(x, 680, `[${['A', 'S', 'D'][i]}] 机关`, { 
        fontFamily: UI_FONT, fontSize: '18px', color: '#ffffff' 
      }).setOrigin(0.5).setDepth(101)

      btn.on('pointerdown', () => this.triggerTrap(i))
      
      btn.setData('text', btnText)
      btn.setData('index', i)
    })
  }

  // 🌟 核心修复：生成逻辑，避免好人贴脸
  private spawnEnemyWave() {
    if (this.completed) return
    
    const rand = Math.random()
    
    // 判断某条车道是否安全（上方 200px 内没有其他火柴人）
    const isLaneSafe = (lane: number) => {
      return !this.enemies.some(e => e.getData('lane') === lane && e.y < 200)
    }

    if (rand < 0.3) {
      // 单个敌人
      const lane = Phaser.Math.Between(0, 2)
      this.createCharacter(lane, 0, 'enemy')
    } else if (rand < 0.5) {
      // 一排敌人
      for (let i = 0; i < 3; i++) {
        this.createCharacter(i, 0, 'enemy')
      }
    } else if (rand < 0.75) {
      // 敌人连击
      const lane = Phaser.Math.Between(0, 2)
      this.createCharacter(lane, 0, 'enemy')
      this.createCharacter(lane, -120, 'enemy')
    } else {
      // 🌟 生成好人：寻找一条完全没有人的车道，或者上方没有人的车道
      const safeLanes = [0, 1, 2].filter(l => isLaneSafe(l))
      
      if (safeLanes.length > 0) {
        const lane = Phaser.Utils.Array.GetRandom(safeLanes)
        // 生成好人时，稍微往下一点，确保不在屏幕顶端突然出现
        this.createCharacter(lane, Phaser.Math.Between(-20, 20), 'civilian')
      }
    }
  }

  private createCharacter(lane: number, offsetY: number, type: 'enemy' | 'civilian') {
    const x = LANE_X[lane]
    const container = this.add.container(x, offsetY).setDepth(50)
    
    const g = this.add.graphics()
    const color = type === 'enemy' ? 0xff3333 : 0x4a90e2 
    
    g.lineStyle(4, color, 1) 
    g.fillStyle(color, 1)
    
    // 火柴人
    g.fillCircle(0, -15, 8)
    g.beginPath(); g.moveTo(0, -7); g.lineTo(0, 15); g.strokePath()
    g.beginPath(); g.moveTo(0, -2); g.lineTo(-12, 8); g.strokePath()
    g.beginPath(); g.moveTo(0, -2); g.lineTo(12, 8); g.strokePath()
    g.beginPath(); g.moveTo(0, 15); g.lineTo(-10, 30); g.strokePath()
    g.beginPath(); g.moveTo(0, 15); g.lineTo(10, 30); g.strokePath()

    container.add(g)
    container.setData('lane', lane)
    container.setData('type', type)
    this.enemies.push(container)
  }

  update(_time: number, delta: number) {
    if (this.completed) return

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]
      enemy.y += (ENEMY_SPEED * delta) / 1000

      if (enemy.y > 650) {
        enemy.destroy()
        this.enemies.splice(i, 1)
        
        const type = enemy.getData('type')
        if (type === 'enemy') {
          this.remainingTime = Math.max(0, this.remainingTime - 3)
          this.cameras.main.shake(200, 0.02)
          this.cameras.main.flash(200, 255, 0, 0, false)
        } else {
          this.cameras.main.flash(200, 0, 255, 0, false)
        }
        
        if (this.remainingTime <= 0) {
          this.gameOver()
        }
      }
    }
  }

  private triggerTrap(laneIndex: number) {
    if (this.completed) return
    if (this.cooldowns[laneIndex] > Date.now()) return

    this.cooldowns[laneIndex] = Date.now() + 300 
    this.updateButtonVisual(laneIndex, true)

    const x = LANE_X[laneIndex]
    const explosion = this.add.circle(x, 600, 80, 0xffd700, 0.8).setDepth(200)
    this.tweens.add({
      targets: explosion,
      scale: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => explosion.destroy()
    })

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]
      if (enemy.getData('lane') === laneIndex && enemy.y > 400) {
        const type = enemy.getData('type')
        enemy.destroy()
        this.enemies.splice(i, 1)
        
        if (type === 'enemy') {
          this.score++
          this.scoreText.setText(`拦截: ${this.score}`)
        } else {
          this.remainingTime = Math.max(0, this.remainingTime - 3)
          this.cameras.main.shake(300, 0.03)
          this.cameras.main.flash(300, 255, 0, 0, false)
          this.showToast('⚠️ 误伤平民！时间 -3s')
          
          if (this.remainingTime <= 0) {
            this.gameOver()
          }
        }
      }
    }

    this.time.delayedCall(300, () => {
      this.updateButtonVisual(laneIndex, false)
    })
  }

  private updateButtonVisual(laneIndex: number, isCooling: boolean) {
    const children = this.children.list
    const btn = children.find(c => c instanceof Phaser.GameObjects.Rectangle && c.getData('index') === laneIndex) as Phaser.GameObjects.Rectangle
    const txt = btn?.getData('text') as Phaser.GameObjects.Text

    if (btn && txt) {
      if (isCooling) {
        btn.setFillStyle(0x33332a)
        txt.setAlpha(0.5)
      } else {
        btn.setFillStyle(0x55554a)
        txt.setAlpha(1)
      }
    }
  }

  private showToast(msg: string) {
    const t = this.add.text(640, 300, msg, { 
      fontFamily: UI_FONT, fontSize: '24px', color: '#ff0000', 
      backgroundColor: '#ffffffdd', padding: { x: 16, y: 8 }, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3000).setAlpha(0)

    this.tweens.add({
      targets: t, alpha: 1, y: 250, duration: 200, yoyo: true, hold: 1000, onComplete: () => t.destroy()
    })
  }

  private completeLevel() {
    if (this.completed) return
    this.completed = true
    if (this.spawnTimer) this.spawnTimer.destroy()

    this.hudText.setText('防守成功！')
    
    this.time.delayedCall(1000, () => {
      if (this.overlayOpen) return
      this.overlayOpen = true
      showKnowledgeCard(this, LEVEL.knowledgeCard, () => this.showSuccess())
    })
  }

  private gameOver() {
    if (this.completed) return
    this.completed = true
    if (this.spawnTimer) this.spawnTimer.destroy()

    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, '防线失守', { fontFamily: UI_FONT, fontSize: '32px', color: '#8c2b2b' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, '入侵者冲破了主城大门！', { fontFamily: UI_FONT, fontSize: '18px', color: '#e8dcc8' }).setOrigin(0.5).setDepth(5002)
    
    textButton(this, 640, 460, '重新防守', () => { this.scene.restart() }).setDepth(5002)
    textButton(this, 640, 520, '放弃并返回', () => { this.scene.start('WorldDetailScene', { worldId: 'machu-picchu' }) }).setDepth(5002)
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