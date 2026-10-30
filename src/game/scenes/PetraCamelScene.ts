import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { paintPetraCanyon } from '../world/petraDrawers.ts'
import { petraCamelLevel } from '../data/levels/petra-camel.ts'
import { CoinSystem } from '../systems/CoinSystem.ts'

const LEVEL = petraCamelLevel

type Obstacle = {
  node: Phaser.GameObjects.Container
  type: 'quicksand' | 'pillar' | 'supply'
  width: number
}

export class PetraCamelScene extends Phaser.Scene {
  private jumpCount = 0        // 记录当前连跳次数
  private readonly MAX_JUMP = 2 // 最多允许连跳两次
  private overlayOpen = false
  private completed = false

  private camel!: Phaser.GameObjects.Container
  private camelBody!: Phaser.GameObjects.Graphics
  
  private obstacles: Obstacle[] = []
  private spawnTimer!: Phaser.Time.TimerEvent
  
  private velocityY = 0
  private isJumping = false
  private readonly GRAVITY = 1200
  private readonly JUMP_FORCE = -700
  private readonly GROUND_Y = 550

  // 状态
  private stamina = 100
  private cargo = 100
  private distance = 0
  private readonly MAX_DISTANCE = 5000

  // HUD 进度条
  private staminaBar!: Phaser.GameObjects.Graphics
  private cargoBar!: Phaser.GameObjects.Graphics
  private distanceText!: Phaser.GameObjects.Text

  constructor() {
    super('PetraCamelScene')
  }

  create() {
    this.overlayOpen = false
    this.completed = false
    this.obstacles = []
    this.velocityY = 0
    this.isJumping = false
    this.stamina = 100
    this.cargo = 100
    this.distance = 0

    // 背景
    paintPetraCanyon(this)
    this.drawGround()

    // 骆驼
    this.createCamel()

    // HUD
    this.buildHud()

    // 键盘/鼠标跳跃
    this.input.keyboard!.on('keydown-SPACE', () => this.jump())
    this.input.on('pointerdown', () => this.jump())

    // 障碍物生成器
    this.spawnTimer = this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => this.spawnObstacle(),
    })
        // ★ 开局直接生成两个，填补空白期
    this.time.delayedCall(300, () => this.spawnObstacle())
    this.time.delayedCall(800, () => this.spawnObstacle())
  }

  private drawGround() {
    const g = this.add.graphics().setDepth(30)
    // 沙地
    g.fillStyle(0xd8b898, 1)
    g.fillRect(0, this.GROUND_Y, 1280, 720 - this.GROUND_Y)
    g.lineStyle(2, 0xc8a078, 0.5)
    g.beginPath(); g.moveTo(0, this.GROUND_Y); g.lineTo(1280, this.GROUND_Y); g.strokePath()
  }

    private createCamel() {
    this.camel = this.add.container(200, this.GROUND_Y - 40).setDepth(100)
    this.camelBody = this.add.graphics()

    // 1. 身体底色（浅黄）
    this.camelBody.fillStyle(0xf8d8a8, 1)
    
    // 身体
    this.camelBody.fillEllipse(0, 0, 70, 36)
    // 两个驼峰（深褐色）
    this.camelBody.fillStyle(0xc89070, 1)
    this.camelBody.fillEllipse(-12, -20, 24, 30)
    this.camelBody.fillEllipse(14, -20, 24, 30)

    // 2. 腿（浅黄 + 深色脚掌）
    this.camelBody.fillStyle(0xf8d8a8, 1)
    this.camelBody.fillRect(-25, 15, 10, 30)
    this.camelBody.fillRect(15, 15, 10, 30)
    this.camelBody.fillStyle(0xc89070, 1)
    this.camelBody.fillRect(-25, 40, 12, 6)
    this.camelBody.fillRect(13, 40, 12, 6)

    // 3. 脖子和头（弯曲的）
    this.camelBody.fillStyle(0xf8d8a8, 1)
    this.camelBody.fillRect(30, -30, 16, 30) // 脖子
    this.camelBody.fillEllipse(45, -35, 24, 18) // 头
    // 耳朵
    this.camelBody.fillStyle(0xc89070, 1)
    this.camelBody.fillCircle(42, -45, 5)

    // 4. 眼睛和粉脸颊
    this.camelBody.fillStyle(0x1a1a1a, 1)
    this.camelBody.fillCircle(52, -38, 3)
    this.camelBody.fillStyle(0xf0a0a0, 1)
    this.camelBody.fillCircle(55, -32, 4)

    // 5. 黑色描边（增加卡通感）
    this.camelBody.lineStyle(3, 0x1a1a1a, 1)
    this.camelBody.strokeEllipse(0, 0, 70, 36)
    this.camelBody.strokeEllipse(-12, -20, 24, 30)
    this.camelBody.strokeEllipse(14, -20, 24, 30)
    this.camelBody.strokeRect(-25, 15, 10, 30)
    this.camelBody.strokeRect(15, 15, 10, 30)
    this.camelBody.strokeRect(30, -30, 16, 30)
    this.camelBody.strokeEllipse(45, -35, 24, 18)

    this.camel.add(this.camelBody)
  }
   private jump() {
    if (this.overlayOpen || this.completed) return
    
    // 允许二段跳（连按两下空格，可以在空中再次获得向上的力）
    if (this.jumpCount < this.MAX_JUMP) {
      this.velocityY = this.JUMP_FORCE
      this.isJumping = true
      this.jumpCount++
      
      // 二段跳时，让骆驼翻转一圈，增加视觉反馈
      if (this.jumpCount === 2) {
        this.tweens.add({
          targets: this.camelBody,
          angle: 360,
          duration: 300,
          onComplete: () => { this.camelBody.angle = 0 }
        })
      }
    }
  }

   update(_time: number, delta: number) {
    if (this.overlayOpen || this.completed) return

    // 1. 物理跳跃
    if (this.isJumping) {
      this.velocityY += (this.GRAVITY * delta) / 1000
      this.camel.y += (this.velocityY * delta) / 1000

      if (this.camel.y >= this.GROUND_Y - 40) {
        this.camel.y = this.GROUND_Y - 40
        this.isJumping = false
        this.velocityY = 0
        this.jumpCount = 0 // 落地重置跳跃次数
      }
    }

    // 2. 奔跑动作
    if (!this.isJumping) {
      this.camelBody.rotation = Math.sin(this.time.now / 100) * 0.03
    } else {
      this.camelBody.rotation = 0
    }

    // 3. 前进距离
    const speed = 0.15 * delta
    this.distance += speed
    this.distanceText.setText(`距离：${Math.floor(this.distance)} / ${this.MAX_DISTANCE}`)

    // 4. 耐力随时间消耗
    this.stamina -= 0.002 * delta
    if (this.stamina < 0) {
      this.stamina = 0
      this.gameOver('骆驼力竭倒下了...')
    }
    this.drawBars()

    // 5. 障碍物移动和碰撞
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i]
      obs.node.x -= speed

      // 出屏幕销毁
      if (obs.node.x < -100) {
        obs.node.destroy()
        this.obstacles.splice(i, 1)
        continue
      }

      // 碰撞检测
      if (!this.isJumping) {
        const distX = Math.abs(obs.node.x - this.camel.x)
        if (distX < (obs.width / 2) + 20) {
          
          // 判断是不是补给
          if ((obs as any).type === 'supply') {
            // ★ 吃到补给了！
            this.stamina = Math.min(100, this.stamina + 30)
            this.cargo = Math.min(100, this.cargo + 20)
            this.showToast('获得补给！耐力与货物恢复')
            this.drawBars()
            
            obs.node.destroy()
            this.obstacles.splice(i, 1)
            continue // 跳过后面的伤害逻辑
          } else {
            // 撞上障碍物
            this.cargo -= 20
            this.stamina -= 20
            this.cameras.main.shake(200, 0.02)
            this.showToast('撞上障碍物！')
            
            obs.node.destroy()
            this.obstacles.splice(i, 1)

            if (this.cargo <= 0 || this.stamina <= 0) {
              this.gameOver('货物损毁，商旅失败...')
              return
            }
            this.drawBars()
          }
        }
      }
    }

    // 6. 到达终点
    if (this.distance >= this.MAX_DISTANCE) {
      this.completeLevel()
    }
  }

   private spawnObstacle() {
    if (this.completed || this.overlayOpen) return

    // ★ 有 40% 的概率生成“补给”，60% 生成障碍
    const isSupply = Math.random() < 0.4

    if (isSupply) {
      const type = Math.random() > 0.5 ? 'water' : 'grass'
      const node = this.add.container(900, this.GROUND_Y - 20).setDepth(50)
      
      const g = this.add.graphics()
      if (type === 'water') {
        g.fillStyle(0x4a9eb8, 1)
        g.fillEllipse(0, 0, 60, 20)
        g.fillStyle(0x7ac8d8, 0.8)
        g.fillEllipse(-5, -3, 30, 10)
      } else {
        g.fillStyle(0x5a9e4a, 1)
        g.fillTriangle(0, 0, -15, 30, 15, 30)
        g.fillStyle(0x7ac868, 1)
        g.fillTriangle(0, -5, -10, 20, 10, 20)
      }
      node.add(g)

      this.obstacles.push({ node, type: 'supply', width: 60 } as any)
    } else {
      // 生成障碍（流沙/石柱）
      const isQuicksand = Math.random() > 0.5
      const type = isQuicksand ? 'quicksand' : 'pillar'
      const width = isQuicksand ? 80 : 40
      
      const node = this.add.container(900, this.GROUND_Y).setDepth(50)
      
      const g = this.add.graphics()
      if (isQuicksand) {
        g.fillStyle(0x3a2010, 0.8)
        g.fillEllipse(0, -10, 80, 20)
        g.fillStyle(0x2a1008, 1)
        g.fillEllipse(0, -8, 40, 10)
      } else {
        g.fillStyle(0x6a2c20, 1)
        g.fillRect(-20, -60, 40, 60)
        g.lineStyle(2, 0x3a1008, 1)
        g.strokeRect(-20, -60, 40, 60)
      }
      node.add(g)

      this.obstacles.push({ node, type, width })
    }
  }

  // ===== HUD =====
  private buildHud() {
    const hud = roundedPanel(this, 28, 24, 360, 92).setDepth(2000)
    hud.setScrollFactor(0)

    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, {
      fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f'
    }).setDepth(2001)

    this.add.text(48, 70, LEVEL.objective, {
      fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354'
    }).setDepth(2001)

    // 距离
    this.distanceText = this.add.text(640, 38, `距离：0 / ${this.MAX_DISTANCE}`, {
      fontFamily: UI_FONT, fontSize: '18px', color: '#efe6d8'
    }).setOrigin(0.5, 0).setDepth(2001)

    // 状态条
    this.staminaBar = this.add.graphics().setDepth(2001)
    this.cargoBar = this.add.graphics().setDepth(2001)
    this.drawBars()

    textButton(this, 1150, 100, '重 来', () => {
      this.scene.restart()
    }).setDepth(2001)
  }

  private drawBars() {
    const W = 200
    const H = 14
    
    // 耐力条
    this.staminaBar.clear()
    this.staminaBar.setPosition(1150, 40)
    this.staminaBar.fillStyle(0x2a3038, 0.8)
    this.staminaBar.fillRect(-W/2 - 2, -H/2 - 2, W + 4, H + 4)
    this.staminaBar.fillStyle(0x7ac88a, 1)
    this.staminaBar.fillRect(-W/2, -H/2, W * (this.stamina / 100), H)

    // 货物条
    this.cargoBar.clear()
    this.cargoBar.setPosition(1150, 70)
    this.cargoBar.fillStyle(0x2a3038, 0.8)
    this.cargoBar.fillRect(-W/2 - 2, -H/2 - 2, W + 4, H + 4)
    this.cargoBar.fillStyle(0xd4a338, 1)
    this.cargoBar.fillRect(-W/2, -H/2, W * (this.cargo / 100), H)
  }

  private gameOver(reason: string) {
    if (this.completed) return
    this.completed = true
    this.spawnTimer.remove()
    this.showToast(reason)
    this.time.delayedCall(1500, () => this.scene.restart())
  }

  private completeLevel() {
    if (this.completed) return
    this.completed = true
    this.spawnTimer.remove()
    this.showToast('安全抵达驿站！')
    this.time.delayedCall(1000, () => this.showKnowledgeCard())
  }

  // ===== 对话 & 知识卡 =====
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
    const body = this.add.text(-340, -10, LEVEL.azhuComment, {
      fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', wordWrap: { width: 740 }
    })
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
    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.38).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, LEVEL.successTitle, {
      fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f'
    }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, LEVEL.successBody, {
      fontFamily: UI_FONT, fontSize: '18px', color: '#6a635b', wordWrap: { width: 560 }, align: 'center'
    }).setOrigin(0.5, 0).setDepth(5002)

    LevelProgress.markCompleted(LEVEL.id)
const isPerfect = true // 如果有扣血/掉货变量，请替换
  const reward = CoinSystem.rewardLevel(LEVEL.id, isPerfect)
    CoinSystem.showFloatText(this, reward)

    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'petra' })
    }).setDepth(5002)
  }

  private showToast(msg: string) {
    const t = this.add.text(640, 120, msg, {
      fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f',
      backgroundColor: '#efe6d8ee', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(4000).setAlpha(0)

    this.tweens.add({
      targets: t, alpha: 1, y: 108, duration: 220, yoyo: true, hold: 1400,
      onComplete: () => t.destroy()
    })
  }
}