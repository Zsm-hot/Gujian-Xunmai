import Phaser from 'phaser'
import { UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { machuQuarryLevel } from '../data/levels/machu-quarry.ts'

const LEVEL = machuQuarryLevel

export class MachuQuarryScene extends Phaser.Scene {
  private overlayOpen = false
  private completed = false

  private hudText!: Phaser.GameObjects.Text
  private hintText!: Phaser.GameObjects.Text // 🌟 专门用来提示大小
  
  private powerBarBg!: Phaser.GameObjects.Rectangle
  private powerBarFill!: Phaser.GameObjects.Rectangle
  private powerText!: Phaser.GameObjects.Text
  private isCharging = false
  private power = 0

  private totalGaps = 6
  private currentGapIndex = 0
  
  private gapsData = [
    { x: 820, y: 250, size: 80 },
    { x: 1050, y: 280, size: 60 },
    { x: 900, y: 380, size: 100 },
    { x: 1150, y: 420, size: 70 },
    { x: 780, y: 450, size: 90 },
    { x: 1000, y: 200, size: 50 },
  ]

  private currentStone: Phaser.GameObjects.Container | null = null
  private wallGaps: Phaser.GameObjects.Rectangle[] = []
  private gapTween: Phaser.Tweens.Tween | null = null // 记录闪烁动画

  constructor() {
    super('MachuQuarryScene')
  }

  create() {
    this.overlayOpen = false
    this.completed = false
    this.isCharging = false
    this.power = 0
    this.currentGapIndex = 0
    this.wallGaps = []
    this.gapTween = null

    this.drawQuarryBackground()
    this.buildHud()
    this.buildPowerBar()
    this.createGapPositions()
    
    this.spawnStone()
    this.highlightCurrentGap() // 开启第一个缺口的闪烁

    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (this.completed) return
      if (currentlyOver.length > 0) return
      if (!this.currentStone) return

      this.isCharging = true
      this.power = 0
    })

    this.input.on('pointerup', () => {
      if (this.completed || !this.isCharging) return
      this.isCharging = false
      this.launchStone()
    })
  }

  private drawQuarryBackground() {
    this.add.rectangle(640, 360, 1280, 720, 0x1a2b24, 1).setDepth(-10)
    const g = this.add.graphics().setDepth(-5)
    g.fillStyle(0x4a5a45, 1); g.fillRect(0, 500, 1280, 220)
    g.fillStyle(0x8a8a7a, 1); g.fillRect(750, 150, 500, 400)
    g.lineStyle(2, 0x6a6a5a, 0.8)
    for (let i = 0; i < 15; i++) {
      g.beginPath(); g.moveTo(750, 150 + i * 30); g.lineTo(1250, 150 + i * 30); g.strokePath()
    }
  }

  private createGapPositions() {
    this.gapsData.forEach(pos => {
      const gap = this.add.rectangle(pos.x, pos.y, pos.size, pos.size, 0x1a2b24).setDepth(-4)
      gap.setStrokeStyle(2, 0x33332a, 1)
      this.wallGaps.push(gap)
    })
  }

  private buildHud() {
    roundedPanel(this, 28, 24, 480, 110).setDepth(2000) // 稍微加大了面板
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    
    this.hudText = this.add.text(48, 70, `修复进度: 0 / ${this.totalGaps}。点击左侧石头，再按住空地蓄力`, { 
      fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354' 
    }).setDepth(2001)

    // 🌟 新增的高亮提示文字
    this.hintText = this.add.text(48, 100, `当前目标：需要填补 80 大小的缺口`, { 
      fontFamily: UI_FONT, fontSize: '14px', color: '#d4a338', fontStyle: 'bold' 
    }).setDepth(2001)

    textButton(this, 1150, 100, '重 来', () => { this.scene.restart() }).setDepth(2001)
  }

  // 🌟 让当前缺口闪烁起来，并更新提示文字
  private highlightCurrentGap() {
    if (this.currentGapIndex >= this.totalGaps) return

    // 清除上一个闪烁动画
    if (this.gapTween) this.gapTween.stop()

    const currentGap = this.wallGaps[this.currentGapIndex]
    const targetSize = this.gapsData[this.currentGapIndex].size

    // 更新左上角文字
    this.hintText.setText(`当前目标：下一个缺口需要 [ ${targetSize} ] 大小的石头！`)

    // 让当前缺口发光闪烁
    currentGap.setStrokeStyle(4, 0xffd700, 1) // 金色边框
    this.gapTween = this.tweens.add({
      targets: currentGap,
      alpha: { from: 1, to: 0.3 }, // 透明度闪烁
      duration: 500,
      yoyo: true,
      repeat: -1
    })
  }

  private buildPowerBar() {
    this.powerBarBg = this.add.rectangle(640, 650, 400, 24, 0x222222).setDepth(3000)
    this.powerBarBg.setStrokeStyle(2, 0x8a8a7a)
    this.powerBarFill = this.add.rectangle(440, 650, 0, 20, 0x5a8a4a).setDepth(3001)
    this.powerText = this.add.text(640, 680, '力量: 0', {
      fontFamily: UI_FONT, fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3002)
  }

  private spawnStone() {
    const targetGap = this.gapsData[this.currentGapIndex]
    const targetSize = targetGap.size

    const sizes = [targetSize, targetSize * 0.6, targetSize * 1.4]
    Phaser.Utils.Array.Shuffle(sizes)

    const startPositions = [
      { x: 200, y: 550 }, { x: 200, y: 430 }, { x: 200, y: 300 }
    ]

    sizes.forEach((size, index) => {
      const pos = startPositions[index]
      const container = this.add.container(pos.x, pos.y).setDepth(50)
      const g = this.add.graphics()
      
      const color = Phaser.Math.RND.pick([0x7a7a6a, 0x8a8a7a, 0x6a6a5a])
      g.fillStyle(color, 1); g.fillRect(-size / 2, -size / 2, size, size)
      g.lineStyle(3, 0x33332a, 1); g.strokeRect(-size / 2, -size / 2, size, size)
      
      container.add(g)
      container.setSize(size, size).setInteractive({ useHandCursor: true })
      
      const isValid = size === targetSize
      container.setData('valid', isValid)
      
      container.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation()
        if (this.completed || this.isCharging) return
        
        this.currentStone = container
        if (isValid) {
          this.hudText.setText('✅ 石材完美！按住空白处蓄力！')
          this.hudText.setColor('#5a8a4a')
        } else {
          this.hudText.setText(`❌ 尺寸（${size}）不匹配，需要（${targetSize}）`)
          this.hudText.setColor('#8c2b2b')
        }
        
        this.powerText.setText('力量: 0')
        this.powerBarFill.width = 0
        
        this.tweens.add({ targets: container, scale: 1.1, duration: 100, yoyo: true })
      })
    })
  }

  update(_time: number, delta: number) {
    if (this.completed) return

    if (this.isCharging) {
      this.power += delta * 0.15
      if (this.power > 100) this.power = 0 
      
      this.powerBarFill.width = (this.power / 100) * 400
      this.powerBarFill.x = 440 + this.powerBarFill.width / 2
      this.powerText.setText(`力量: ${Math.floor(this.power)}`)

      if (this.power > 80) {
        this.powerBarFill.setFillStyle(0x8c2b2b); this.powerText.setColor('#ff6b6b')
      } else if (this.power > 50) {
        this.powerBarFill.setFillStyle(0xd4a338); this.powerText.setColor('#d4a338')
      } else {
        this.powerBarFill.setFillStyle(0x5a8a4a); this.powerText.setColor('#ffffff')
      }
    }
  }

  private launchStone() {
    if (!this.currentStone) return

    const stone = this.currentStone
    this.currentStone = null
    const isValid = stone.getData('valid')
    const powerUsed = this.power

    const isPowerCorrect = powerUsed > 75 && powerUsed < 95
    const target = this.gapsData[this.currentGapIndex]

    this.tweens.add({
      targets: stone,
      x: target.x, y: target.y, angle: 360, duration: 500, ease: 'Quad.easeIn',
      onComplete: () => {
        if (isValid && isPowerCorrect) {
          this.cameras.main.flash(300, 255, 255, 255)
          
          stone.setPosition(target.x, target.y).setAngle(0).setDepth(10)
          
          // 隐藏那个缺口
          this.wallGaps[this.currentGapIndex].setVisible(false)
          if (this.gapTween) this.gapTween.stop() // 停止闪烁
          
          this.currentGapIndex++
          this.hudText.setColor('#7d6354').setText(`修复进度: ${this.currentGapIndex} / ${this.totalGaps}。`)

          if (this.currentGapIndex >= this.totalGaps) {
            this.hintText.setText('城墙已全面修复！')
            this.time.delayedCall(1000, () => this.completeLevel())
          } else {
            this.time.delayedCall(500, () => {
              this.clearStones()
              this.spawnStone()
              this.highlightCurrentGap() // 高亮下一个缺口
            })
          }

        } else {
          this.cameras.main.shake(300, 0.03)
          let reason = ''
          if (!isValid) reason = '石材尺寸不匹配，无法咬合！'
          else if (powerUsed <= 75) reason = '推力太小，石头掉落了！'
          else reason = '推力太大，石头撞碎了！'

          this.hudText.setText(reason + ' 请重试。')
          this.hudText.setColor('#8c2b2b')
          
          this.tweens.add({
            targets: stone, y: 800, alpha: 0, duration: 500, onComplete: () => { stone.destroy() }
          })

          this.time.delayedCall(1500, () => {
            this.clearStones()
            this.spawnStone()
            this.powerText.setText('力量: 0')
            this.powerBarFill.width = 0
            this.hintText.setText(`当前目标：下一个缺口需要 [ ${this.gapsData[this.currentGapIndex].size} ] 大小的石头！`)
          })
        }
      }
    })
  }

  private clearStones() {
    this.children.list.forEach(child => {
      if (child instanceof Phaser.GameObjects.Container && child.getData('valid') !== undefined) {
        child.destroy()
      }
    })
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

  private showSuccess() {
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, LEVEL.successTitle, { fontFamily: UI_FONT, fontSize: '32px', color: '#d4a338' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, LEVEL.successBody, { fontFamily: UI_FONT, fontSize: '18px', color: '#e8dcc8', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5, 0).setDepth(5002)

    LevelProgress.markCompleted(LEVEL.id)
    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'machu-picchu' })
    }).setDepth(5002)
  }
}