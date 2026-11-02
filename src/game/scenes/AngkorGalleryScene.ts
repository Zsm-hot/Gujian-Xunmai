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
const SURVIVAL_TIME = 25000    

export class AngkorGalleryScene extends Phaser.Scene {
  private completed = false
  private currentLane = 1 
  private player!: Phaser.Physics.Arcade.Sprite
  private isJumping = false
  private isSliding = false
  private shield = 3 
  private score = 0  
  private currentSpeed = BASE_SPEED 

  private startTime = 0
  private timeText!: Phaser.GameObjects.Text

  private shieldText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text

  private obstacles!: Phaser.Physics.Arcade.Group
  private collectibles!: Phaser.Physics.Arcade.Group

  private chaserG!: Phaser.GameObjects.Graphics 
  private groundLines: Phaser.GameObjects.Rectangle[] = [] 

  constructor() {
    super('AngkorGalleryScene')
  }

  preload() {
    this.load.image('angkor-bg', 'assets/angkor-corridor.jpg')
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
    
    this.startTime = this.time.now
    this.physics.world.gravity.y = 0

    // 生成一个隐形的物理纹理，用于绑定物理引擎
    this.textures.generate('pixel', { data: ['0'], pixelWidth: 1, pixelHeight: 1 })
    this.textures.generate('player', { data: ['1'], pixelWidth: 40, pixelHeight: 60 })

    this.drawCorridorBackground()

    this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true })
    this.collectibles = this.physics.add.group({ allowGravity: false, immovable: true })

    this.createPlayer()

    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, (_player, obs) => {
      return !this.completed && (obs as Phaser.Physics.Arcade.Sprite).active
    }, this)

    this.physics.add.overlap(this.player, this.collectibles, this.collectShard, (_player, shard) => {
      return !this.completed && (shard as Phaser.Physics.Arcade.Sprite).active
    }, this)

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
    if (this.textures.exists('angkor-bg')) {
      this.add.image(640, 360, 'angkor-bg').setDisplaySize(1280, 720).setDepth(-10)
      this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.3).setDepth(-9) // 稍微减轻一点遮罩，让画面更通透
      
      const vignette = this.add.graphics().setDepth(-8)
      vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.8, 0, 0.8, 0)
      vignette.fillRect(0, 0, 300, 720)
      vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.8, 0, 0.8)
      vignette.fillRect(980, 0, 300, 720)
    } else {
      this.add.rectangle(640, 360, 1280, 720, 0x1a1614, 1).setDepth(-10)
    }

    // 🌟 1. 把两侧的细线换成厚重的“石柱边缘”
    const g = this.add.graphics().setDepth(-5)
    
    // 左侧石条
    g.fillStyle(0x2a2624, 1) // 石头暗部
    g.beginPath(); g.moveTo(320, 720); g.lineTo(440, 200); g.lineTo(455, 200); g.lineTo(345, 720); g.closePath(); g.fillPath()
    g.fillStyle(0x5a5048, 1) // 石头亮部受光面
    g.beginPath(); g.moveTo(345, 720); g.lineTo(455, 200); g.lineTo(465, 200); g.lineTo(365, 720); g.closePath(); g.fillPath()
    
    // 右侧石条
    g.fillStyle(0x2a2624, 1)
    g.beginPath(); g.moveTo(960, 720); g.lineTo(835, 200); g.lineTo(820, 200); g.lineTo(935, 720); g.closePath(); g.fillPath()
    g.fillStyle(0x5a5048, 1)
    g.beginPath(); g.moveTo(935, 720); g.lineTo(820, 200); g.lineTo(810, 200); g.lineTo(915, 720); g.closePath(); g.fillPath()

    // 保留中间的辅助线（极淡）
    g.lineStyle(1, 0xd4a338, 0.1)
    g.beginPath(); g.moveTo(640, 720); g.lineTo(640, 200); g.strokePath()

    // 动态移动的地面横线（代表速度感，压暗一点）
    for (let i = 0; i < 15; i++) {
      const line = this.add.rectangle(640, Phaser.Math.Between(200, 750), 400, 2, 0xffffff, 0.1).setDepth(-4)
      this.groundLines.push(line)
    }
    this.chaserG = this.add.graphics().setDepth(10)
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(LANE_X[1], PLAYER_Y, 'player')
    this.player.setTint(0xd4a338)
    this.player.setDepth(100)
    this.player.body!.setSize(40, 60)
    ;(this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    ;(this.player.body as Phaser.Physics.Arcade.Body).setImmovable(true)
    
    const pG = this.add.graphics().setDepth(100)
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
    roundedPanel(this, 28, 24, 300, 140).setDepth(2000)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    this.shieldText = this.add.text(48, 70, '叙事屏障: 🛡️🛡️🛡️', { fontFamily: UI_FONT, fontSize: '18px', color: '#8c2b2b', fontStyle: 'bold' }).setDepth(2001)
    this.scoreText = this.add.text(48, 100, '残片收集: 0', { fontFamily: UI_FONT, fontSize: '16px', color: '#d4a338', fontStyle: 'bold' }).setDepth(2001)
    
    this.timeText = this.add.text(48, 126, `逃生倒计时: ${(SURVIVAL_TIME/1000).toFixed(1)}s`, { fontFamily: UI_FONT, fontSize: '16px', color: '#8c2b2b', fontStyle: 'bold' }).setDepth(2001)

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

    // 🌟 2. 加入透视缩放效果，让障碍物有冲刺感
    this.obstacles.getChildren().forEach((child) => {
      const obj = child as Phaser.Physics.Arcade.Sprite
      if (obj.active) {
        obj.y += this.currentSpeed * delta / 1000
        // 在 Y=200(远) 到 Y=750(近) 之间，将大小从 0.5 放大到 1.2 倍
        const scale = Phaser.Math.Linear(0.5, 1.2, Phaser.Math.Clamp((obj.y - 200) / 550, 0, 1))
        obj.setScale(scale)
        if (obj.y > 750) obj.destroy()
      }
    })

    this.collectibles.getChildren().forEach((child) => {
      const obj = child as Phaser.Physics.Arcade.Sprite
      if (obj.active) {
        obj.y += this.currentSpeed * delta / 1000
        const scale = Phaser.Math.Linear(0.5, 1.2, Phaser.Math.Clamp((obj.y - 200) / 550, 0, 1))
        obj.setScale(scale)
        if (obj.y > 750) obj.destroy()
      }
    })

    const elapsed = this.time.now - this.startTime
    const timeLeft = Math.max(0, SURVIVAL_TIME - elapsed)
    this.timeText.setText(`逃生倒计时: ${(timeLeft / 1000).toFixed(1)}s`)

    if (elapsed >= SURVIVAL_TIME) {
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

  // 🌟 3. 重绘障碍物美术：石块 与 树枝
  private createObstacle(lane: number, y: number, type: 'jump' | 'slide') {
    if (this.completed) return
    const obs = this.obstacles.create(LANE_X[lane], y, 'pixel') as Phaser.Physics.Arcade.Sprite
    obs.setDepth(80)
    obs.setActive(true)
    obs.setVisible(true)
    obs.setAlpha(0) // 隐藏那个 1x1 像素的物理体

    const g = this.add.graphics().setDepth(80)
    
    if (type === 'jump') {
      // 【需要跳跃的障碍】：巨大的石块
      obs.body!.setSize(60, 50)
      obs.setData('type', 'jump')
      
      // 画石块的体积感（多边形）
      g.fillStyle(0x3a3532, 1) // 底座暗部
      g.fillPoints([
        {x: -30, y: 20}, {x: -20, y: -20}, {x: 15, y: -25}, {x: 30, y: 5}, {x: 20, y: 25}
      ], true)
      
      g.fillStyle(0x6a6560, 1) // 受光面
      g.fillPoints([
        {x: -20, y: -20}, {x: 15, y: -25}, {x: 5, y: -5}, {x: -15, y: 5}
      ], true)
      
      g.lineStyle(2, 0x1a1614, 0.8) // 裂纹细节
      g.beginPath(); g.moveTo(0, -20); g.lineTo(-5, 0); g.lineTo(10, 15); g.strokePath()
      g.beginPath(); g.moveTo(10, 15); g.lineTo(25, 5); g.strokePath()
      
    } else {
      // 【需要滑铲的障碍】：横跨半空的粗树枝
      obs.body!.setSize(80, 30)
      obs.setData('type', 'slide')
      
      // 画树枝
      g.lineStyle(12, 0x2a1e14, 1) // 粗树枝暗部
      g.beginPath(); g.moveTo(-40, 0); g.lineTo(40, 5); g.strokePath()
      g.lineStyle(6, 0x5c4630, 1) // 树枝亮部
      g.beginPath(); g.moveTo(-40, -2); g.lineTo(40, 3); g.strokePath()
      
      // 树叶
      g.fillStyle(0x3a5a2a, 1)
      g.fillEllipse(-20, -10, 20, 10)
      g.fillEllipse(25, 10, 15, 8)
    }

    obs.setData('visual', g)
    
    // 同步视觉与物理位置，同时应用缩放
    this.events.on('update', () => {
      if (obs.active) {
        g.setPosition(obs.x, obs.y)
        g.setScale(obs.scaleX) // 继承物理体的缩放
      } else {
        g.destroy()
      }
    })
  }

  private createCollectible(lane: number, y: number) {
    if (this.completed) return
    const shard = this.collectibles.create(LANE_X[lane], y, 'pixel') as Phaser.Physics.Arcade.Sprite
    shard.setDepth(80)
    shard.setActive(true)
    shard.setVisible(true)
    shard.setAlpha(0)
    shard.body!.setSize(40, 40)
    
    const g = this.add.graphics().setDepth(80)
    // 画发光的符文碎片
    g.fillStyle(0xffd700, 1)
    g.fillTriangle(0, -20, 15, 0, 0, 20)
    g.fillTriangle(0, -20, -15, 0, 0, 20)
    g.fillStyle(0xffffff, 0.8) // 高光
    g.fillTriangle(0, -15, 5, -5, -5, -5)
    g.lineStyle(2, 0xffaa00, 1)
    g.strokeTriangle(0, -20, 15, 0, 0, 20)
    g.strokeTriangle(0, -20, -15, 0, 0, 20)

    shard.setData('visual', g)
    
    this.events.on('update', () => {
      if (shard.active) {
        g.setPosition(shard.x, shard.y)
        g.setScale(shard.scaleX)
        g.rotation += 0.05
      } else {
        g.destroy()
      }
    })
  }

  private hitObstacle(_player: any, obs: any) {
    if (this.completed || !obs.active) return
    const type = obs.getData('type')
    if ((type === 'jump' && this.isJumping) || (type === 'slide' && this.isSliding)) return 

    if (!obs.getData('hit')) {
      obs.setData('hit', true)
      obs.setActive(false) 
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
    if (this.completed || !shard.active) return
    shard.setActive(false)
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