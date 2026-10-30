import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { paintPetraCanyon } from '../world/petraDrawers.ts'
import { petraCanalLevel } from '../data/levels/petra-canal.ts'
import { CoinSystem } from '../systems/CoinSystem.ts'

const LEVEL = petraCanalLevel

export class PetraCanalScene extends Phaser.Scene {
  private overlayOpen = false
  private completed = false

  private progress = 0
  private totalTasks = 3
  private progressBar!: Phaser.GameObjects.Graphics

  // 三种状态的清理完成标记
  private rockCleared = false
  private mudCleared = false
  private sandCleared = false

  // 点击淤泥的计数
  private mudClickCount = 0
  // 点击砂石的计数
  private sandClickCount = 0

  // 水流特效
  private waterFlow!: Phaser.GameObjects.Graphics

  constructor() {
    super('PetraCanalScene')
  }

  create() {
    this.overlayOpen = false
    this.completed = false
    this.progress = 0
    this.rockCleared = false
    this.mudCleared = false
    this.sandCleared = false
    this.mudClickCount = 0
    this.sandClickCount = 0

    // 1. 背景
    paintPetraCanyon(this)

    // 2. 画古渠（干枯状态）
    this.drawCanal()

    // 3. 初始化三种堵塞物
    this.setupObstacles()

    // 4. HUD
    this.buildHud()
  }

      private drawCanal() {
    const g = this.add.graphics().setDepth(20)
    
    const points = [
      { x: 100, y: 360 },
      { x: 200, y: 370 },
      { x: 300, y: 350 },
      { x: 470, y: 380 },
      { x: 640, y: 420 },
      { x: 800, y: 380 },
      { x: 950, y: 330 },
      { x: 1050, y: 340 },
      { x: 1180, y: 360 }
    ]

    // 渠底（粗线）
    g.lineStyle(40, 0x6a5a4a, 1)
    g.beginPath()
    g.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y)
    }
    g.strokePath()

    // 渠边缘（描边）
    g.lineStyle(4, 0x3a2210, 1)
    // 上边缘
    g.beginPath()
    g.moveTo(points[0].x, points[0].y - 20)
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y - 20)
    }
    g.strokePath()
    // 下边缘
    g.beginPath()
    g.moveTo(points[0].x, points[0].y + 20)
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y + 20)
    }
    g.strokePath()

    this.waterFlow = this.add.graphics().setDepth(30)
  }
  
  // ===== 设置三种堵塞物 =====
  private setupObstacles() {
      // ★ 提示卡片
    const tipPanel = this.add.container(640, 220).setDepth(200)
    const bg = this.add.graphics()
    bg.fillStyle(0x2a1a10, 0.8)
    bg.fillRoundedRect(-300, -30, 600, 60, 10)
    tipPanel.add(bg)
    
    const tipText = this.add.text(0, 0, '任务一：把左侧的「碎石」拖到屏幕外', {
      fontFamily: UI_FONT, fontSize: '18px', color: '#d4a338'
    }).setOrigin(0.5)
    tipPanel.add(tipText)
    // ① 粗碎石块（屏幕左侧）—— 拖拽搬离
    const rockNode = this.add.container(300, 350).setDepth(40)
    const rockG = this.add.graphics()
    rockG.fillStyle(0x5a4a3a, 1)
    rockG.fillCircle(0, 0, 25)
    rockG.fillStyle(0x7a6a5a, 1)
    rockG.fillCircle(-5, -5, 15)
    rockNode.add(rockG)
    rockNode.setSize(120, 120).setInteractive({ useHandCursor: true })

    // 拖拽逻辑
    this.input.setDraggable(rockNode)
    rockNode.on('drag', (_pointer: any, dragX: number, dragY: number) => {
      if (this.rockCleared) return
      rockNode.x = dragX
      rockNode.y = dragY
    })
    rockNode.on('dragend', () => {
      if (this.rockCleared) return
      // 如果拖出渠道范围（上下大于 150 或者拖到了很远的地方）
      if (rockNode.y < 200 || rockNode.y > 600) {
        this.rockCleared = true
        tipText.setText('任务二：点击中间的「淤泥」刮除它')
        this.tweens.add({
          targets: rockNode,
          alpha: 0,
          y: 700,
          duration: 500,
          onComplete: () => rockNode.destroy()
        })
        this.showToast('碎石已搬离')
        this.advanceProgress()
      } else {
        // 没拖出去，弹回原位
        this.tweens.add({
          targets: rockNode,
          x: 300,
          y: 380,
          duration: 300
        })
        this.showToast('把碎石拖远一点')
      }
    })

    // ② 板结淤泥（屏幕中间）—— 连续点击刮除
    const mudNode = this.add.container(640, 420).setDepth(40)
    const mudG = this.add.graphics()
    mudG.fillStyle(0x4a3a2a, 1)
    mudG.fillRect(-40, -20, 80, 40)
    mudG.lineStyle(2, 0x2a1a10, 1)
    mudG.strokeRect(-40, -20, 80, 40)
    mudNode.add(mudG)
    // 破损遮罩（随着点击变透明/缩小）
    const mudMask = this.add.graphics().setDepth(41)
    mudMask.fillStyle(0x6a5a4a, 1)
    mudMask.fillRect(-40, -20, 80, 40)
    mudNode.add(mudMask)

        const mudHit = this.add.rectangle(640, 420, 160, 100, 0x000000, 0.001).setDepth(42).setInteractive({ useHandCursor: true })
       mudHit.on('pointerdown', () => {
      if (this.mudCleared) return
      this.mudClickCount++
      
      // ★ 每次点击都有小震感
      this.cameras.main.shake(80, 0.005)
      
      // 每次点击，遮罩缩小
      mudMask.setScale(1 - this.mudClickCount * 0.2)
      this.showToast(`刮除淤泥 (${this.mudClickCount}/5)`)
      
      if (this.mudClickCount >= 5) {
        tipText.setText('任务三：点击右侧「砂石」点通它')
        this.mudCleared = true
        this.tweens.add({
          targets: mudNode,
          alpha: 0,
          duration: 300,
          onComplete: () => { mudNode.destroy(); mudHit.destroy() }
        })
        this.showToast('淤泥已刮除')
        this.advanceProgress()
      }
    })

    // ③ 堵塞管口砂石（屏幕右侧）—— 精细点通
    const sandNode = this.add.container(950, 330).setDepth(40)
    const sandG = this.add.graphics()
    // 管口
    sandG.fillStyle(0x3a2210, 1)
    sandG.fillRect(-30, -30, 60, 60)
    sandG.lineStyle(2, 0x2a1008, 1)
    sandG.strokeRect(-30, -30, 60, 60)
    // 细沙
    sandG.fillStyle(0xd8b898, 1)
    sandG.fillRect(-20, -20, 40, 40)
    sandNode.add(sandG)

    // 这是一个需要“快准狠”的点击（用随机位置微调）
      const sandHit = this.add.rectangle(950, 330, 120, 120, 0x000000, 0.001).setDepth(42).setInteractive({ useHandCursor: true })
    sandHit.on('pointerdown', () => {
      if (this.sandCleared) return
      
      // 模拟精准点通（点中了就加进度）
      this.sandClickCount++
      this.cameras.main.shake(100, 0.005)
      // 每次点击掉落一点细沙
      sandG.clear()
      sandG.fillStyle(0x3a2210, 1)
      sandG.fillRect(-30, -30, 60, 60)
      sandG.lineStyle(2, 0x2a1008, 1)
      sandG.strokeRect(-30, -30, 60, 60)
      
      const remaining = 40 - this.sandClickCount * 10
      if (remaining > 0) {
        sandG.fillStyle(0xd8b898, 1)
        sandG.fillRect(-20, -20, remaining, remaining)
      }

      this.showToast(`精细点通 (${this.sandClickCount}/4)`)

      if (this.sandClickCount >= 4) {
        this.sandCleared = true
        this.tweens.add({
          targets: sandNode,
          alpha: 0,
          duration: 300,
          onComplete: () => { sandNode.destroy(); sandHit.destroy() }
        })
        this.showToast('砂石已点通')
        this.advanceProgress()
      }
    })
  }

  // ===== 进度推进 =====
  private advanceProgress() {
    this.progress++
    this.drawProgressBar()
    // 每次清理一部分，水渠就从左到右延伸一部分
    this.drawWaterFlow()

    if (this.progress >= this.totalTasks) {
      this.completeLevel()
    }
  }

  // ===== 画水流特效 =====
     private drawWaterFlow() {
    if (!this.waterFlow) return
    this.waterFlow.clear()
    
    const points = [
      { x: 100, y: 360 },
      { x: 200, y: 370 },
      { x: 300, y: 350 },
      { x: 470, y: 380 },
      { x: 640, y: 420 },
      { x: 800, y: 380 },
      { x: 950, y: 330 },
      { x: 1050, y: 340 },
      { x: 1180, y: 360 }
    ]

    // 根据进度截取水流长度
    let endIndex = 0
    if (this.progress === 1) endIndex = 2
    else if (this.progress === 2) endIndex = 4
    else if (this.progress === 3) endIndex = points.length - 1

    if (endIndex > 0) {
      // 画主水流
      this.waterFlow.lineStyle(34, 0x4a9eb8, 0.85)
      this.waterFlow.beginPath()
      this.waterFlow.moveTo(points[0].x, points[0].y)
      for (let i = 1; i <= endIndex; i++) {
        this.waterFlow.lineTo(points[i].x, points[i].y)
      }
      this.waterFlow.strokePath()

      // 画水面高光
      this.waterFlow.lineStyle(4, 0x7ac8d8, 0.6)
      this.waterFlow.beginPath()
      this.waterFlow.moveTo(points[0].x, points[0].y - 5)
      for (let i = 1; i <= endIndex; i++) {
        this.waterFlow.lineTo(points[i].x, points[i].y - 5)
      }
      this.waterFlow.strokePath()
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

    // 进度条
    this.progressBar = this.add.graphics().setDepth(2001)
    this.drawProgressBar()

    textButton(this, 1150, 100, '重 来', () => {
      this.scene.restart()
    }).setDepth(2001)
  }

  private drawProgressBar() {
    const W = 300
    const H = 16
    const x = 640
    const y = 80

    this.progressBar.clear()
    this.progressBar.fillStyle(0x2a3038, 0.8)
    this.progressBar.fillRect(x - W/2 - 2, y - H/2 - 2, W + 4, H + 4)
    this.progressBar.fillStyle(0x4a9eb8, 1)
    this.progressBar.fillRect(x - W/2, y - H/2, W * (this.progress / this.totalTasks), H)
    
    // 文字
    const text = this.children.getByName('progress-text')
    if (text) text.destroy()
    this.add.text(x, y, `清理进度：${this.progress} / ${this.totalTasks}`, {
      fontFamily: UI_FONT, fontSize: '14px', color: '#efe6d8', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2002).setName('progress-text')
  }

  private completeLevel() {
    if (this.completed) return
    this.completed = true
    this.showToast('古渠贯通！泉水正在重新涌出...')

    // 通关动画：水渠闪烁 + 从岩壁流出
    this.waterFlow.clear()
    this.waterFlow.fillStyle(0x4a9eb8, 0.9)
    this.waterFlow.fillRect(100, 360, 1080, 40)
    this.tweens.add({
      targets: this.waterFlow,
      alpha: 0.5,
      yoyo: true,
      repeat: 3,
      duration: 300
    })

    this.time.delayedCall(2000, () => this.showKnowledgeCard())
  }

  // ===== 知识卡 & 结算 =====
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

        // 🌟 改用写死的字符串 ID
    LevelProgress.markCompleted('petra-canal')
    
    // 🌟 这个关卡没有 attempts 变量，直接算作完美通关（拿全额金币）
    const isPerfect = true 
    const reward = CoinSystem.rewardLevel('petra-canal', isPerfect)
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