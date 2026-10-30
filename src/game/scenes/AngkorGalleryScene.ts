import Phaser from 'phaser'
import { UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts'
import { angkorGalleryLevel } from '../data/levels/angkor-gallery.ts'

const LEVEL = angkorGalleryLevel

const LANE_X = [450, 640, 830] 
const PLAYER_Y = 550           
const BASE_SPEED = 400         
const MAX_SPEED = 800          
const ACCELERATION = 15        

export class AngkorGalleryScene extends Phaser.Scene {
  private completed = false
  private currentLane = 1 
  private player!: Phaser.Physics.Arcade.Sprite
  private isJumping = false
  private isSliding = false
  private shield = 3 
  private score = 0  
  private currentSpeed = BASE_SPEED 

  private shieldText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text

  private obstacles!: Phaser.Physics.Arcade.Group
  private collectibles!: Phaser.Physics.Arcade.Group

  private chaserG!: Phaser.GameObjects.Graphics 
  private groundLines: Phaser.GameObjects.Rectangle[] = [] 

  constructor() {
    super('AngkorGalleryScene')
  }

  create() {
    this.completed = false
    this.currentLane = 1
    this.isJumping = false
    this.isSliding = false
    this.shield = 3
    this.score = 0
    this.currentSpeed = BASE_SPEED
    this.groundLines = []

    this.textures.generate('pixel', { data: ['0'], pixelWidth: 1, pixelHeight: 1 })
    this.textures.generate('player', { data: ['1'], pixelWidth: 40, pixelHeight: 60 })

    this.drawCorridorBackground()

    this.obstacles = this.physics.add.group()
    this.collectibles = this.physics.add.group()

    this.createPlayer()

    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, undefined, this)
    this.physics.add.overlap(this.player, this.collectibles, this.collectShard, undefined, this)

    this.buildUI()

    this.input.keyboard!.on('keydown-A', () => this.moveLane(-1))
    this.input.keyboard!.on('keydown-D', () => this.moveLane(1))
    this.input.keyboard!.on('keydown-W', () => this.jump())
    this.input.keyboard!.on('keydown-S', () => this.slide())

    this.time.addEvent({
      delay: 650,
      callback: this.spawnObject,
      callbackScope: this,
      loop: true
    })
  }

  private drawCorridorBackground() {
    this.add.rectangle(640, 360, 1280, 720, 0x1a1614, 1).setDepth(-10)
    const g = this.add.graphics().setDepth(-5)
    g.lineStyle(4, 0x3a2a20, 0.8)
    g.beginPath(); g.moveTo(300, 720); g.lineTo(450, 200); g.strokePath()
    g.beginPath(); g.moveTo(980, 720); g.lineTo(830, 200); g.strokePath()
    g.beginPath(); g.moveTo(640, 720); g.lineTo(640, 200); g.strokePath()

    for (let i = 0; i < 15; i++) {
      const line = this.add.rectangle(640, Phaser.Math.Between(200, 750), 400, 4, 0x5a4a3a, 0.5).setDepth(-4)
      this.groundLines.push(line)
    }
    this.chaserG = this.add.graphics().setDepth(10)
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(LANE_X[1], PLAYER_Y, 'player')
    this.player.setTint(0xd4a338)
    this.player.setDepth(100)
    this.player.body!.setSize(40, 60)
    
    const pG = this.add.graphics()
    pG.fillStyle(0xd4a338, 1)
    pG.fillCircle(0, -20, 15)
    pG.fillRect(-10, -5, 20, 30)
    pG.lineStyle(2, 0x4a453f, 1)
    pG.strokeCircle(0, -20, 15)
    pG.strokeRect(-10, -5, 20, 30)
    
    this.events.on('update', () => {
      pG.setPosition(this.player.x, this.player.y)
    })
  }

  private buildUI() {
    roundedPanel(this, 28, 24, 300, 120).setDepth(2000)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    this.shieldText = this.add.text(48, 70, '叙事屏障: 🛡️🛡️🛡️', { fontFamily: UI_FONT, fontSize: '18px', color: '#8c2b2b', fontStyle: 'bold' }).setDepth(2001)
    this.scoreText = this.add.text(48, 100, '残片收集: 0', { fontFamily: UI_FONT, fontSize: '16px', color: '#d4a338', fontStyle: 'bold' }).setDepth(2001)
    this.add.text(1150, 40, 'A/D 左右变道\nW 跳跃\nS 滑铲', { fontFamily: UI_FONT, fontSize: '14px', color: '#e8dcc8', align: 'right', backgroundColor: '#000000aa', padding: {x:10, y:10} }).setOrigin(1, 0).setDepth(2001)
  }

  update(_time: number, delta: number) {
    if (this.completed) return
    this.currentSpeed = Math.min(this.currentSpeed + ACCELERATION * delta / 1000, MAX_SPEED)

    this.groundLines.forEach(line => {
      line.y += this.currentSpeed * delta / 1000
      if (line.y > 750) {
        line.y = 200
        line.x = 640 + Phaser.Math.Between(-150, 150)
      }
    })

    this.chaserG.clear()
    this.chaserG.fillStyle(0x8c2b2b, 0.2 + Math.sin(_time / 200) * 0.1)
    this.chaserG.fillRect(0, 650, 1280, 70)

    this.obstacles.getChildren().forEach((child) => {
      const obj = child as Phaser.Physics.Arcade.Sprite
      obj.y += this.currentSpeed * delta / 1000
      if (obj.y > 750) obj.destroy()
    })

    this.collectibles.getChildren().forEach((child) => {
      const obj = child as Phaser.Physics.Arcade.Sprite
      obj.y += this.currentSpeed * delta / 1000
      if (obj.y > 750) obj.destroy()
    })

    if (_time > 25000 && !this.completed) {
      this.completeLevel()
    }
  }

  private moveLane(dir: number) {
    if (this.isJumping || this.completed) return 
    const newLane = this.currentLane + dir
    if (newLane >= 0 && newLane <= 2) {
      this.currentLane = newLane
      this.tweens.add({ targets: this.player, x: LANE_X[this.currentLane], duration: 100, ease: 'Power2' })
    }
  }

  private jump() {
    if (this.isJumping || this.isSliding || this.completed) return
    this.isJumping = true
    this.tweens.add({
      targets: this.player, y: PLAYER_Y - 150, duration: 300, yoyo: true, ease: 'Sine.easeOut',
      onComplete: () => { this.isJumping = false }
    })
  }

  private slide() {
    if (this.isJumping || this.isSliding || this.completed) return
    this.isSliding = true
    this.player.setScale(1, 0.5)
    this.player.y = PLAYER_Y + 20
    this.time.delayedCall(600, () => {
      this.isSliding = false
      this.player.setScale(1, 1)
      this.player.y = PLAYER_Y
    })
  }

  private spawnObject() {
    if (this.completed) return
    const rand = Math.random()
    const lane = Math.floor(Math.random() * 3)
    
    if (rand < 0.3) {
      const trapType = Math.random()
      if (trapType < 0.5) {
        this.createObstacle(lane, 100, 'jump')
        this.time.delayedCall(400, () => this.createObstacle(lane, 100, 'jump'))
      } else {
        this.createObstacle(lane, 100, 'jump')
        this.time.delayedCall(450, () => this.createObstacle(lane, 100, 'slide'))
      }
    } else if (rand < 0.7) {
      const type = rand < 0.5 ? 'jump' : 'slide'
      this.createObstacle(lane, 100, type)
    } else {
      this.createCollectible(lane, 100)
    }
  }

  private createObstacle(lane: number, y: number, type: 'jump' | 'slide') {
    if (this.completed) return
    const obs = this.obstacles.create(LANE_X[lane], y, 'pixel') as Phaser.Physics.Arcade.Sprite
    obs.setDepth(80)
    
    if (type === 'jump') {
      obs.setTint(0x5c574f); obs.body!.setSize(50, 40); obs.setData('type', 'jump')
      const g = this.add.graphics(); g.fillStyle(0x6a6a5a, 1); g.fillCircle(0, 0, 25); g.lineStyle(2, 0x3a3a2a, 1); g.strokeCircle(0, 0, 25)
      obs.setData('visual', g)
    } else {
      obs.setTint(0x8c3b2b); obs.body!.setSize(50, 20); obs.setData('type', 'slide')
      const g = this.add.graphics(); g.fillStyle(0x8c3b2b, 1); g.fillRect(-30, -10, 60, 20); g.lineStyle(2, 0x4a1b0b, 1); g.strokeRect(-30, -10, 60, 20)
      obs.setData('visual', g)
    }

    const vis = obs.getData('visual') as Phaser.GameObjects.Graphics
    this.events.on('update', () => {
      if (obs.active) vis.setPosition(obs.x, obs.y)
      else vis.destroy()
    })
  }

  private createCollectible(lane: number, y: number) {
    if (this.completed) return
    const shard = this.collectibles.create(LANE_X[lane], y, 'pixel') as Phaser.Physics.Arcade.Sprite
    shard.setDepth(80).setTint(0xffd700)
    shard.body!.setSize(30, 30)
    
    const g = this.add.graphics()
    g.fillStyle(0xffd700, 1); g.fillTriangle(0, -15, 15, 0, 0, 15); g.fillTriangle(0, -15, -15, 0, 0, 15)
    shard.setData('visual', g)

    const vis = shard.getData('visual') as Phaser.GameObjects.Graphics
    this.events.on('update', () => {
      if (shard.active) { vis.setPosition(shard.x, shard.y); vis.rotation += 0.05 } 
      else vis.destroy()
    })
  }

  private hitObstacle(_player: any, obs: any) {
    if (this.completed) return
    const type = obs.getData('type')
    if ((type === 'jump' && this.isJumping) || (type === 'slide' && this.isSliding)) return 

    if (!obs.getData('hit')) {
      obs.setData('hit', true)
      this.shield--
      this.updateShieldUI()
      this.cameras.main.shake(200, 0.02)
      this.cameras.main.flash(200, 255, 0, 0, false)
      
      obs.destroy()
      const vis = obs.getData('visual') as Phaser.GameObjects.Graphics
      if (vis) vis.destroy()

      if (this.shield <= 0) this.gameOver('叙事屏障碎裂，被阿修罗吞噬了！')
    }
  }

  private collectShard(_player: any, shard: any) {
    if (this.completed) return
    this.score++
    this.scoreText.setText(`残片收集: ${this.score}`)
    this.cameras.main.flash(100, 255, 215, 0, false)
    
    shard.destroy()
    const vis = shard.getData('visual') as Phaser.GameObjects.Graphics
    if (vis) vis.destroy()
  }

  private updateShieldUI() {
    const hearts = ['🛡️', '🛡️', '🛡️']
    for (let i = this.shield; i < 3; i++) {
      if (i >= 0) hearts[i] = '💔'
    }
    this.shieldText.setText(`叙事屏障: ${hearts.join('')}`)
  }

  private gameOver(reason: string) {
    if (this.completed) return
    this.completed = true
    this.physics.pause()
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8).setDepth(5000)
    this.add.text(640, 300, '逃亡失败: ' + reason, { fontFamily: UI_FONT, fontSize: '32px', color: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5).setDepth(5002)
    textButton(this, 640, 460, '重新挑战', () => { this.scene.restart() }).setDepth(5002)
    textButton(this, 640, 520, '放弃并返回', () => { this.scene.start('WorldDetailScene', { worldId: 'angkor' }) }).setDepth(5002)
  }
  
  private completeLevel() {
    if (this.completed) return
    this.completed = true
    this.physics.pause()

    LevelProgress.markCompleted(LEVEL.id)
    
    const isPerfect = this.shield === 3
    const reward = CoinSystem.rewardLevel(LEVEL.id, isPerfect)
    CoinSystem.showFloatText(this, reward)

    showKnowledgeCard(this, LEVEL.knowledgeCard, () => {
      this.scene.start('WorldDetailScene', { worldId: 'angkor' })
    })
  }
}