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

  create() {
    // ===== 背景 =====
    // ① 深蓝底色
    const bg = this.add.graphics().setDepth(0)
    bg.fillGradientStyle(0x0d1320, 0x0d1320, 0x1a2238, 0x2a3450, 1)
    bg.fillRect(0, 0, 1280, 720)

    // ② 中心"光晕"
    const glow = this.add.circle(640, 360, 300, 0xd4a338, 0.06).setDepth(0)
    this.tweens.add({
      targets: glow,
      scale: 1.15,
      alpha: 0.1,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // ③ 雾气
    const mist1 = this.add.circle(200, 200, 180, 0x2a3450, 0.3).setDepth(0)
    const mist2 = this.add.circle(1080, 500, 220, 0x2a3450, 0.25).setDepth(0)
    const mist3 = this.add.circle(640, 600, 150, 0x1a2238, 0.35).setDepth(0)

    this.tweens.add({
      targets: mist1,
      x: 300,
      y: 250,
      duration: 8000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
    this.tweens.add({
      targets: mist2,
      x: 980,
      y: 450,
      duration: 10000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
    this.tweens.add({
      targets: mist3,
      x: 700,
      y: 580,
      duration: 7000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // ④ 装饰圆环
    const ring1 = this.add.circle(640, 360, 300, 0x000000, 0).setDepth(1)
    ring1.setStrokeStyle(1, 0xd4a338, 0.15)
    const ring2 = this.add.circle(640, 360, 200, 0x000000, 0).setDepth(1)
    ring2.setStrokeStyle(1, 0xd4a338, 0.1)

    // ⑤ 星星
    for (let i = 0; i < 30; i += 1) {
      const x = Math.random() * 1280
      const y = Math.random() * 720
      const star = this.add.circle(x, y, 1, 0xd4a338, 0.3).setDepth(1)
      this.tweens.add({
        targets: star,
        alpha: 0.6,
        duration: 1500 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000,
      })
    }

    // ===== 阿筑 =====
    const azhuGlow = this.add.circle(640, 180, 60, 0xd4a338, 0.2).setDepth(1).setAlpha(0)
    this.tweens.add({
      targets: azhuGlow,
      scale: 1.3,
      alpha: 0.08,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    const azhuIcon = this.add
      .text(640, 180, '🌸', { fontSize: '64px' })
      .setOrigin(0.5)
      .setDepth(2)
      .setAlpha(0)

    const azhuName = this.add
      .text(640, 240, '阿 筑', {
        fontFamily: UI_FONT,
        fontSize: '20px',
        color: '#d4a338',
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setAlpha(0)

    // ===== 正文 =====
    this.textRef = this.add
      .text(640, 380, '', {
        fontFamily: UI_FONT,
        fontSize: '22px',
        color: '#efe6d8',
        wordWrap: { width: 900, useAdvancedWrap: true },
        align: 'center',
        lineSpacing: 12,
      })
      .setOrigin(0.5)
      .setDepth(2)

    // ===== 提示 =====
    const hint = this.add
      .text(640, 600, '· 点 击 继 续 ·', {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#d4a338',
      })
      .setOrigin(0.5)
      .setDepth(2)
      .setAlpha(0)

    // ===== 入场动画 =====
    this.tweens.add({
      targets: [azhuIcon, azhuName, azhuGlow],
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

    // 显示第 1 句
    this.time.delayedCall(800, () => this.showLine(0))

    // 点击 → 下一句
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