import { worlds } from '../data/worlds.ts'
import { showCatPostcard } from '../ui/CatPostcardUI.ts'
import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts' // 🌟 引入金币系统
import { paintPetraCanyon } from '../world/petraDrawers.ts'
import { petraWaterLevel } from '../data/levels/petra-water.ts'

const LEVEL = petraWaterLevel

export class PetraWaterScene extends Phaser.Scene {
  private overlayOpen = false
  private completed = false

  private waterLevel = 60
  private readonly MAX_WATER = 100

  // 闸门状态：-1(左) / 1(右) / 0(中间)
  private gateState = 0 

  private gateKnob!: Phaser.GameObjects.Arc
  private waterGraphics!: Phaser.GameObjects.Graphics
  private modeText!: Phaser.GameObjects.Text
  private waterLevelText!: Phaser.GameObjects.Text
  private timerEvent!: Phaser.Time.TimerEvent

  // 阶段控制
  private phase: 'flood' | 'drought' = 'flood'
  private floodCleared = false
  private droughtCleared = false
  
  // 🌟 记录切换季节次数，用于完美通关判定
  private attempts = 0

  constructor() {
    super('PetraWaterScene')
  }

  create() {
    this.overlayOpen = false
    this.completed = false
    this.phase = 'flood'
    this.floodCleared = false
    this.droughtCleared = false
    this.waterLevel = 60
    this.gateState = 0
    this.attempts = 0 // 🌟 重置失误次数

    // 1. 背景
    paintPetraCanyon(this)

    // 2. 构建地形
    this.buildTerrain()

    // 3. 构建分水闸门
    this.createGate()

    // 4. 构建 HUD
    this.buildHud()

    // 5. 启动水位模拟
    this.timerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: this.updateWaterLogic,
      callbackScope: this,
    })
  }

  // 绘制真实地形
  private buildTerrain() {
    const g = this.add.graphics().setDepth(100)

    // 1. 中间：主河流
    g.fillStyle(0x4a9eb8, 1)
    g.fillRect(580, 500, 120, 200)

    // 2. 左侧：泄洪区
    g.fillStyle(0x6a2c20, 0.8)
    g.fillRect(200, 300, 200, 400)
    g.lineStyle(4, 0xd04848, 0.5)
    g.strokeRect(200, 300, 200, 400)

    // 3. 右侧：城市水渠（基础框）
    g.fillStyle(0x2a4858, 0.8)
    g.fillRect(880, 300, 200, 400)
    g.lineStyle(4, 0xd4a338, 1)
    g.strokeRect(880, 300, 200, 400)

    // 4. 在城市水渠里画出“树状支流”的底纹
    const drawBranch = (startX: number, startY: number, angle: number, depth: number) => {
      if (depth === 0) return
      const len = Phaser.Math.Between(20, 40)
      const endX = startX + Math.cos(angle) * len
      const endY = startY + Math.sin(angle) * len
      
      if (endX > 880 && endX < 1080 && endY > 300 && endY < 700) {
        g.lineStyle(depth, 0x4a9eb8, 0.3) 
        g.beginPath()
        g.moveTo(startX, startY)
        g.lineTo(endX, endY)
        g.strokePath()

        drawBranch(endX, endY, angle - Phaser.Math.FloatBetween(0.2, 0.6), depth - 1)
        drawBranch(endX, endY, angle + Phaser.Math.FloatBetween(0.2, 0.6), depth - 1)
        if (Math.random() > 0.5) {
          drawBranch(endX, endY, angle + Phaser.Math.FloatBetween(-0.1, 0.1), depth - 1)
        }
      }
    }

    drawBranch(980, 500, -Math.PI / 2, 4) 
    drawBranch(980, 500, Math.PI / 2, 4)  
    drawBranch(980, 500, 0, 4)            
    drawBranch(980, 500, Math.PI, 4)      

    // ★ 区域文字标签
    this.add.text(300, 260, '泄 洪 区', {
      fontFamily: UI_FONT, fontSize: '22px', color: '#d04848', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(150)

    this.add.text(980, 260, '城 市 水 渠', {
      fontFamily: UI_FONT, fontSize: '22px', color: '#d4a338', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(150)

    this.add.text(640, 540, '主 水 道', {
      fontFamily: UI_FONT, fontSize: '18px', color: '#4a9eb8', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(150)

    this.waterGraphics = this.add.graphics().setDepth(110)

    // 实时水位显示
    this.waterLevelText = this.add.text(640, 690, '', {
      fontFamily: UI_FONT, fontSize: '16px', color: '#efe6d8',
      backgroundColor: '#2a1a10cc', padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setDepth(2000)
  }

  // 构建分水闸门
  private createGate() {
    const cx = 640
    const cy = 450

    const g = this.add.graphics().setDepth(150)
    g.fillStyle(0x2a1a10, 0.8)
    g.fillRoundedRect(cx - 150, cy - 20, 300, 40, 10)
    g.lineStyle(2, 0x8a5a1a, 1)
    g.strokeRoundedRect(cx - 150, cy - 20, 300, 40, 10)

    this.gateKnob = this.add.circle(cx, cy, 25, 0xd4a338, 1).setDepth(151)
    this.gateKnob.setStrokeStyle(3, 0xefe6d8, 1)

    const hitZone = this.add.zone(cx, cy, 300, 60).setInteractive({ useHandCursor: true }).setDepth(152)
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.overlayOpen || this.completed) return
      if ((this.phase === 'flood' && this.floodCleared) || (this.phase === 'drought' && this.droughtCleared)) return
      
      if (pointer.x < cx) {
        this.gateState = -1
        this.tweens.add({ targets: this.gateKnob, x: cx - 80, duration: 200, ease: 'Back.easeOut' })
      } else {
        this.gateState = 1
        this.tweens.add({ targets: this.gateKnob, x: cx + 80, duration: 200, ease: 'Back.easeOut' })
      }
    })
  }

  // 核心水位更新逻辑
  private updateWaterLogic() {
    if (this.overlayOpen || this.completed) return
    if ((this.phase === 'flood' && this.floodCleared) || (this.phase === 'drought' && this.droughtCleared)) return

    // 1. 自然变化
    if (this.phase === 'flood') {
      this.waterLevel += 0.6 
    } else {
      this.waterLevel += 0.2 
    }

    // 2. 闸门分流
    if (this.gateState === -1) {
      this.waterLevel -= 1.2 
    } else if (this.gateState === 1) {
      if (this.phase === 'flood') {
        this.waterLevel -= 0.1 
      } else {
        this.waterLevel += 0.6 
      }
    }

    this.waterLevel = Phaser.Math.Clamp(this.waterLevel, 0, this.MAX_WATER)

    // 3. 判定阶段目标
    if (this.phase === 'flood' && this.waterLevel <= 40 && !this.floodCleared) {
      this.floodCleared = true
      this.showToast('成功泄洪！请点击顶部按钮切换到旱季')
    } 
    else if (this.phase === 'drought' && this.waterLevel >= 70 && !this.droughtCleared) {
      this.droughtCleared = true
      this.showToast('城市水渠已蓄满！')
      this.completeLevel()
    }

    // 4. 渲染
    this.drawWater()
  }

  // 渲染水流与水位
  private drawWater() {
    const g = this.waterGraphics
    g.clear()

    const cx = 640
    const cy = 450
    const knobX = this.gateKnob.x

    // 1. 中间主河流
    const mainH = (this.waterLevel / 100) * 200
    g.fillStyle(this.phase === 'flood' ? 0xd04848 : 0x4a9eb8, 0.9)
    g.fillRect(580, 700 - mainH, 120, mainH)

    // 2. 闸门管道
    g.fillStyle(0x4a9eb8, 0.8)
    g.fillRect(cx, cy, knobX - cx, 10)
    g.fillRect(knobX, cy, 10, 250)

    // 3. 左侧泄洪区
    if (this.gateState === -1) {
      g.fillStyle(0xd04848, 0.7)
      g.fillRect(200, cy, knobX - 200, 10)
      
      g.fillStyle(0xd04848, 0.4) 
      const leftH = (this.waterLevel / 100) * 400
      g.fillRect(200, 700 - leftH, 200, leftH) 
    }

    // 4. 右侧城市水渠
    if (this.gateState === 1) {
      g.fillStyle(0x4a9eb8, 0.8)
      g.fillRect(knobX, cy, 880 - knobX + 200, 10) 
      g.fillStyle(0x4a9eb8, 0.6)
      g.fillRect(880, 700 - (this.waterLevel / 100) * 400, 200, (this.waterLevel / 100) * 400)
    }

    // 5. 更新顶部实时水位文字
    let waterColor = '#efe6d8'
    if (this.waterLevel <= 40) waterColor = '#5a9a4a'
    else if (this.waterLevel >= 70) waterColor = '#d04848'

    this.waterLevelText.setText(`主水道水位：${Math.floor(this.waterLevel)}  ( <40 安全 | >70 蓄满 )`)
    this.waterLevelText.setColor(waterColor)

    // 6. 左侧泄洪区文字
    const leftText = this.children.getByName('left-hud')
    if (leftText) leftText.destroy()
    if (this.gateState === -1) {
      this.add.text(300, 690, `泄洪区蓄水：${Math.floor(this.waterLevel)}`, {
        fontFamily: UI_FONT, fontSize: '16px', color: '#d04848',
        backgroundColor: '#efe6d8ee', padding: { x: 10, y: 4 }
      }).setOrigin(0.5).setDepth(2000).setName('left-hud')
    }
  }

  // 切换季节
  private switchMode(toFlood: boolean) {
    this.phase = toFlood ? 'flood' : 'drought'
    this.gateState = 0
    this.gateKnob.x = 640
    
    if (toFlood) {
      this.modeText.setText('当前：☀️ 洪水季')
      this.modeText.setColor('#d04848')
      this.waterLevel = 60 
      this.floodCleared = false
    } else {
      this.modeText.setText('当前：🌧️ 干旱季')
      this.modeText.setColor('#4a9eb8')
      this.waterLevel = 30 
      this.droughtCleared = false
    }
  }

  private buildHud() {
    const hud = roundedPanel(this, 28, 24, 360, 92).setDepth(2000)
    hud.setScrollFactor(0)

    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, {
      fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f'
    }).setDepth(2001)

    this.add.text(48, 70, LEVEL.objective, {
      fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354'
    }).setDepth(2001)

    this.modeText = this.add.text(640, 50, '当前：☀️ 洪水季', {
      fontFamily: UI_FONT, fontSize: '22px', color: '#d04848', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2001)

    textButton(this, 640, 100, '切换到旱季', () => {
      if (this.phase === 'flood' && this.floodCleared) {
        this.switchMode(false)
      } else if (this.phase === 'flood') {
        this.showToast('先成功泄洪才能切换旱季！')
      }
    }).setDepth(2001)

    textButton(this, 1150, 100, '重 来', () => {
      this.scene.restart()
    }).setDepth(2001)

    this.add.text(640, 190, '目标：洪水期把水引向左侧（降到40以下）；旱季把水引向右侧（升到70以上）', {
      fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f',
      backgroundColor: '#efe6d8cc', padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setDepth(2001)
  }

  private completeLevel() {
    if (this.completed) return
    this.completed = true
    this.timerEvent.remove()
    this.showToast('水网平衡！')
    this.time.delayedCall(1000, () => this.showKnowledgeCard())
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
    // 🌟 标记通关
    LevelProgress.markCompleted('petra-water')

    // 🌟 发金币（只要没狂切季节就算完美，或者自定义你的完美条件）
    const isPerfect = this.attempts === 0 
    const reward = CoinSystem.rewardLevel('petra-water', isPerfect)
    CoinSystem.showFloatText(this, reward)

    // 判断全通关弹明信片
    const currentWorld = worlds.find(w => w.id === 'petra')
    if (currentWorld?.levels?.every(lv => LevelProgress.isCompleted(lv.id))) {
      showCatPostcard(this, 'petra') 
    }

    // 渲染成功面板
    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.38).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    
    this.add.text(640, 230, '荒漠生机', { 
      fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f' 
    }).setOrigin(0.5).setDepth(5002)
    
    this.add.text(640, 300, '水网与商路重新焕发生机，玫瑰古城再次苏醒。', { 
      fontFamily: UI_FONT, fontSize: '18px', color: '#6a635b', wordWrap: { width: 560 }, align: 'center' 
    }).setOrigin(0.5, 0).setDepth(5002)

    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'petra' })
    }).setDepth(5002)
  }

  private showToast(msg: string) {
    const t = this.add.text(640, 160, msg, {
      fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f',
      backgroundColor: '#efe6d8ee', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(4000).setAlpha(0)

    this.tweens.add({
      targets: t, alpha: 1, y: 148, duration: 220, yoyo: true, hold: 1400,
      onComplete: () => t.destroy()
    })
  }
}