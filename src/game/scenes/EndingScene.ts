import Phaser from 'phaser'
import { UI_FONT } from '../palette.ts'
import { textButton } from '../ui/panels.ts'
import { AudioSystem } from '../systems/AudioSystem.ts'
import { CATS } from '../data/cats.ts'

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('EndingScene')
  }

  create() {
    // 1. 渲染唯美背景（偏深色的古卷质感）
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x1a1614, 0x1a1614, 0x3a2a20, 0x3a2a20, 1)
    bg.fillRect(0, 0, 1280, 720)

    // 2. 播放通关音效（如果有 BGM 也可以在这里播放）
    AudioSystem.playSFX('success')

    // 3. 飘落的金色光尘粒子
    // 我们需要先动态生成一个白色像素纹理给粒子系统用
    this.textures.generate('pixel', { data: ['0'], pixelWidth: 2, pixelHeight: 2 })
    this.add.particles(0, 0, 'pixel', {
      x: { min: 0, max: 1280 },
      y: -50,
      speedY: { min: 30, max: 100 },
      speedX: { min: -20, max: 20 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 6000,
      quantity: 2,
      frequency: 50,
      tint: [0xd4a338, 0xffffff, 0xffea00] // 金色、白色、亮黄色
    }).setDepth(10)

    // 4. 核心文字展示（延迟出现）
    const title = this.add.text(640, 100, '《 营 造 之 书 》', {
      fontFamily: UI_FONT, fontSize: '48px', color: '#d4a338', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(20).setAlpha(0)

    this.tweens.add({ targets: title, alpha: 1, y: 120, duration: 1500, ease: 'Power2' })

    // 5. 猫咪图鉴展示区
    const catKeys = Object.keys(CATS)
    catKeys.forEach((key, i) => {
      const cat = CATS[key]
      const col = i % 4
      const row = Math.floor(i / 4)
      const x = 340 + col * 200
      const y = 280 + row * 180

      const card = this.add.container(x, y).setDepth(20)
      
      // 猫咪占位圆框
      const bgCircle = this.add.circle(0, 0, 50, 0xffffff, 0.1)
      bgCircle.setStrokeStyle(2, 0xd4a338, 0.8)
      const icon = this.add.text(0, 0, '🐈', { fontSize: '40px' }).setOrigin(0.5)
      const name = this.add.text(0, 70, cat.name, { fontFamily: UI_FONT, fontSize: '16px', color: '#e8dcc8' }).setOrigin(0.5)
      
      card.add([bgCircle, icon, name])
      
      // 依序弹出的动画
      card.setScale(0)
      this.tweens.add({
        targets: card,
        scale: 1,
        delay: 1000 + i * 150, // 在标题出现后依次弹出
        duration: 500,
        ease: 'Back.easeOut'
      })
    })

    // 6. 最终字幕
    const endingText = this.add.text(640, 640, '八枚文明印记已汇合。\n古建真正的共同智慧，是让人、自然与空间彼此成全。', {
      fontFamily: UI_FONT, fontSize: '20px', color: '#b09a6e', fontStyle: 'italic', align: 'center', lineSpacing: 10
    }).setOrigin(0.5).setDepth(20).setAlpha(0)

    this.tweens.add({
      targets: endingText,
      alpha: 1,
      delay: 3500, // 等猫咪弹完后出现
      duration: 1500
    })

    // 7. 返回主菜单按钮
    const backBtn = textButton(this, 640, 700, '重返寻脉之旅', () => {
      AudioSystem.playSFX('click')
      this.scene.start('TitleScene')
    }).setDepth(20).setAlpha(0)

    this.tweens.add({
      targets: backBtn,
      alpha: 1,
      delay: 5000,
      duration: 1000
    })
  }
}