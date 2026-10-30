import Phaser from 'phaser'
import { worlds } from '../data/worlds.ts'
import { palette, UI_FONT } from '../palette.ts'
import { textButton } from '../ui/panels.ts'
import { AudioSystem } from '../systems/AudioSystem.ts'

export class TitleScene extends Phaser.Scene {
  constructor() {
    // 👇 必须叫 TitleScene
    super('TitleScene') 
  }

  preload() {
    this.load.image('cover-bg', 'assets/cover.jpg')
  }

  create() {
    // 1. 绘制全屏封面背景
    if (this.textures.exists('cover-bg')) {
      const bg = this.add.image(640, 360, 'cover-bg')
      const scaleX = 1280 / bg.width
      const scaleY = 720 / bg.height
      const scale = Math.max(scaleX, scaleY)
      bg.setScale(scale).setDepth(-10)
    } else {
      const g = this.add.graphics().setDepth(-10)
      g.fillGradientStyle(palette.sky, palette.mist, palette.sage, palette.paper, 1)
      g.fillRect(0, 0, 1280, 720)
    }

    // 2. 顶部渐变遮罩
    const topGradient = this.add.graphics().setDepth(-5)
    topGradient.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 0.7, 0.7, 0, 0)
    topGradient.fillRect(0, 0, 1280, 150)

    // 3. 核心标题
    const titleText = this.add.text(640, 200, '古建寻脉 · 八方营造录', {
      fontFamily: UI_FONT,
      fontSize: '56px',
      color: '#3a3028',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    titleText.setShadow(0, 2, '#ffffff', 6, true, true)
    titleText.setStroke('#3a3028', 1)

    // 4. 开始按钮
    textButton(this, 640, 500, '展 开 地 图', () => {
      AudioSystem.playSFX('click')
      const key = 'gujian-xunmai:intro-seen'
      const seen = (() => {
        try {
          return localStorage.getItem(key) === 'true'
        } catch {
          return false
        }
      })()
      this.scene.start(seen ? 'WorldMapScene' : 'IntroScene')
    }).setDepth(10)

    // 🌟 5. 底部世界列表
    const worldLines = worlds.map((world) => 
      `${world.name}（${world.status === 'playable' ? '可入' : '待寻'}）`
    )
    
    const row1 = worldLines.slice(0, 4).join('    ')
    const row2 = worldLines.slice(4, 8).join('    ')

    const textStyle = {
      fontFamily: UI_FONT, 
      fontSize: '16px',
      color: '#4a3020', 
      fontStyle: 'bold',
      stroke: '#ffffff', 
      strokeThickness: 4
    }

    this.add.text(640, 610, row1, textStyle).setOrigin(0.5).setDepth(10)
    this.add.text(640, 640, row2, textStyle).setOrigin(0.5).setDepth(10)
    
    this.add.text(640, 680, '· 八枚文明印记 · 汇合于《营造之书》 ·', {
      fontFamily: UI_FONT, 
      fontSize: '13px', 
      color: '#ffffff',
      backgroundColor: '#4a3020cc',
      padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setDepth(10)

    // 🌟 6. 开发者测试后门：按键盘上的 E 键，直接看大结局！
    this.input.keyboard!.on('keydown-E', () => {
      AudioSystem.playSFX('success')
      this.scene.start('EndingScene')
    })
  }
}