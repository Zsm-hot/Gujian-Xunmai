import Phaser from 'phaser'
import { UI_FONT } from '../palette.ts'

const INTRO_KEY = 'gujian-xunmai:intro-seen'

const LINES = [
  { speaker: '', text: '世界的古建筑，共同守护着一本《营造之书》。' },
  { speaker: '', text: '书中没有唯一正确的建筑——' },
  { speaker: '', text: '只记录着：人如何把材料、秩序、信仰与生活，组织成可以延续的空间。' },
  { speaker: '', text: '但书页散落成了八枚文明印记。' },
  { speaker: '', text: '建筑的记忆开始错位——檐角神兽失序、木塔构件失衡……' },
  { speaker: '', text: '你，作为新任"寻脉者"，将与阿筑一起，重走八方。' },
]

export class IntroScene extends Phaser.Scene {
  private currentLine = 0
  private textRef!: Phaser.GameObjects.Text

  constructor() {
    super('IntroScene')
  }

  // 加载阿筑的立绘 和 星河背景图
  preload() {
    this.load.image('azhu-avatar', 'assets/azhu.png')
    this.load.image('xinghe-bg', 'assets/xinghe.png')
  }

  create() {
    // ===== 背景 =====
    // ① 星河背景图
    if (this.textures.exists('xinghe-bg')) {
      this.add.image(640, 360, 'xinghe-bg')
        .setDisplaySize(1280, 720)
        .setDepth(0)
    } else {
      const bg = this.add.graphics().setDepth(0)
      bg.fillGradientStyle(0x0d1320, 0x0d1320, 0x1a2238, 0x2a3450, 1)
      bg.fillRect(0, 0, 1280, 720)
    }

    // ② 发光星云（大尺寸、发光叠加模式、缓慢位移呼吸）
    const nebulaColor1 = 0x4a6baf // 深蓝色
    const nebulaColor2 = 0x8050b0 // 紫色
    const nebula1 = this.add.circle(300, 250, 250, nebulaColor1, 0.15).setDepth(1).setBlendMode(Phaser.BlendModes.ADD)
    const nebula2 = this.add.circle(1000, 500, 300, nebulaColor2, 0.12).setDepth(1).setBlendMode(Phaser.BlendModes.ADD)

    this.tweens.add({
      targets: nebula1,
      x: 400, y: 300, scale: 1.3, alpha: 0.25,
      duration: 8000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    })
    this.tweens.add({
      targets: nebula2,
      x: 900, y: 400, scale: 1.4, alpha: 0.2,
      duration: 10000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    })

    // ③ 中心光晕（更明显）
    const glow = this.add.circle(640, 360, 280, 0xd4a338, 0.08).setDepth(1)
    this.tweens.add({
      targets: glow,
      scale: 1.3,
      alpha: 0.15,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // ④ 旋转的装饰法阵（把原本静止的圆环改成动态自转）
    // 使用 Graphics 画虚线，转起来更有仪式感
    const ringGraphics = this.add.graphics().setDepth(2)
    ringGraphics.lineStyle(2, 0xd4a338, 0.25)
    // 画两个同心圆，外面再加一圈刻度
    ringGraphics.strokeCircle(0, 0, 300)
    ringGraphics.strokeCircle(0, 0, 200)
    
    // 画一些间断的刻度线
    for (let i = 0; i < 36; i++) {
        const angle = Phaser.Math.DegToRad(i * 10)
        const x1 = Math.cos(angle) * 280
        const y1 = Math.sin(angle) * 280
        const x2 = Math.cos(angle) * 300
        const y2 = Math.sin(angle) * 300
        ringGraphics.lineBetween(x1, y1, x2, y2)
    }
    
    // 将 Graphics 移到中心并开始旋转
    ringGraphics.setPosition(640, 360)
    this.tweens.add({
      targets: ringGraphics,
      rotation: Math.PI * 2,
      duration: 60000, // 60秒转一圈，缓慢且庄重
      repeat: -1,
      ease: 'Linear'
    })

    // ⑤ 动态十字星光（比小圆点明显很多）
    const starGraphic = this.add.graphics()
    starGraphic.fillStyle(0xffffff, 1)
    starGraphic.fillCircle(2, 2, 2)
    starGraphic.generateTexture('star', 4, 4)
    starGraphic.destroy()

    // 散落 15 颗大星星
    for (let i = 0; i < 15; i += 1) {
      const x = Math.random() * 1280
      const y = Math.random() * 720
      // 用粒子或者图片生成星芒
      const star = this.add.image(x, y, 'star')
        .setDepth(3)
        .setTint(0xffffff)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(Math.random() * 1.5 + 0.5)
        .setAlpha(0.2)

      // 强烈的闪烁和放大效果
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 1 },
        scale: { from: 0.5, to: 2 }, // 放大闪亮
        duration: 1000 + Math.random() * 1500,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000,
        ease: 'Sine.easeInOut'
      })
    }

    // ===== 阿筑 =====
    const azhuGlow = this.add.circle(640, 180, 60, 0xd4a338, 0.2).setDepth(3).setAlpha(0)
    this.tweens.add({
      targets: azhuGlow,
      scale: 1.3,
      alpha: 0.1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    let azhuAvatar: any
    
    if (this.textures.exists('azhu-avatar')) {
      const img = this.add.image(640, 180, 'azhu-avatar').setDepth(4).setAlpha(0)
      img.setDisplaySize(160, 160) 
      azhuAvatar = img
    } else {
      azhuAvatar = this.add.text(640, 180, '🌸', { fontSize: '64px' }).setOrigin(0.5).setDepth(4).setAlpha(0)
    }

    const azhuName = this.add
      .text(640, 280, '阿 筑', {
        fontFamily: UI_FONT,
        fontSize: '20px',
        color: '#d4a338',
      })
      .setOrigin(0.5)
      .setDepth(4)
      .setAlpha(0)

    // ===== 正文 =====
    this.textRef = this.add
      .text(640, 400, '', {
        fontFamily: UI_FONT,
        fontSize: '22px',
        color: '#efe6d8',
        wordWrap: { width: 900, useAdvancedWrap: true },
        align: 'center',
        lineSpacing: 12,
      })
      .setOrigin(0.5)
      .setDepth(4)
      // 给文字加一点轻微的黑色阴影，防止和星河的亮部重叠看不清
      .setShadow(0, 2, '#000000', 4, true, true)

    // ===== 提示 =====
    const hint = this.add
      .text(640, 620, '· 点 击 继 续 ·', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#d4a338',
      })
      .setOrigin(0.5)
      .setDepth(4)
      .setAlpha(0)

    // ===== 入场动画 =====
    this.tweens.add({
      targets: [azhuAvatar, azhuName, azhuGlow],
      alpha: 1,
      duration: 800,
      delay: 200,
    })

    this.tweens.add({
      targets: hint,
      alpha: 0.7,
      duration: 600,
      delay: 800,
    })

    this.time.delayedCall(800, () => this.showLine(0))

    this.input.on('pointerup', () => this.advance())
  }

  private showLine(index: number) {
    if (index >= LINES.length) return

    const line = LINES[index]
    this.textRef.setText(line.text)
    this.textRef.setAlpha(0)

    this.tweens.add({
      targets: this.textRef,
      alpha: 1,
      duration: 400,
    })
  }

  private advance() {
    this.currentLine += 1
    if (this.currentLine >= LINES.length) {
      this.markSeen()
      this.scene.start('WorldMapScene')
      return
    }
    this.showLine(this.currentLine)
  }

  private markSeen() {
    try {
      localStorage.setItem(INTRO_KEY, 'true')
    } catch {
      /* ignore */
    }
  }

  static isSeen(): boolean {
    try {
      return localStorage.getItem(INTRO_KEY) === 'true'
    } catch {
      return false
    }
  }
}