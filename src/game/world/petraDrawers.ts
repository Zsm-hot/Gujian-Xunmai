import Phaser from 'phaser'

const PETRA = {
  sky: 0xd8a898,      // 峡谷透下的天光
  rock: 0x9c4a3a,     // 主岩壁色（玫瑰红）
  rockDark: 0x6a2c20, // 岩石阴影
  rockLight: 0xc86850,// 岩石亮面
  sand: 0xd8b898,     // 底部沙地
  shadow: 0x2a1008,
}

export function paintPetraCanyon(scene: Phaser.Scene) {
  const W = 1280
  const H = 720
  const g = scene.add.graphics().setDepth(-100)

  // 1. 天光
  g.fillGradientStyle(PETRA.sky, PETRA.sky, PETRA.rockDark, PETRA.rockDark, 1)
  g.fillRect(0, 0, W, H)

  // 2. 左侧岩壁
  g.fillStyle(PETRA.rock, 1)
  g.beginPath()
  g.moveTo(0, 0)
  g.lineTo(250, 0)
  g.lineTo(180, 200)
  g.lineTo(220, 400)
  g.lineTo(150, 600)
  g.lineTo(200, H)
  g.lineTo(0, H)
  g.closePath()
  g.fillPath()
  // 岩壁阴影
  g.fillStyle(PETRA.rockDark, 0.6)
  g.beginPath()
  g.moveTo(200, 0); g.lineTo(250, 0); g.lineTo(180, 200); g.lineTo(220, 400); g.lineTo(150, 600); g.lineTo(200, H); g.lineTo(170, H); g.lineTo(120, 600); g.lineTo(190, 400); g.lineTo(150, 200); g.closePath(); g.fillPath()

  // 3. 右侧岩壁
  g.fillStyle(PETRA.rock, 1)
  g.beginPath()
  g.moveTo(W, 0)
  g.lineTo(W - 250, 0)
  g.lineTo(W - 180, 250)
  g.lineTo(W - 240, 500)
  g.lineTo(W - 150, H)
  g.lineTo(W, H)
  g.closePath()
  g.fillPath()
  g.fillStyle(PETRA.rockDark, 0.6)
  g.beginPath()
  g.moveTo(W - 250, 0); g.lineTo(W - 200, 0); g.lineTo(W - 180, 250); g.lineTo(W - 240, 500); g.lineTo(W - 150, H); g.lineTo(W - 200, H); g.lineTo(W - 280, 500); g.lineTo(W - 220, 250); g.closePath(); g.fillPath()

  // 4. 底部沙地 / 栈道
  g.fillStyle(PETRA.sand, 1)
  g.beginPath()
  g.moveTo(150, H)
  g.lineTo(180, 600)
  g.lineTo(1100, 600)
  g.lineTo(W - 150, H)
  g.closePath()
  g.fillPath()

  // 5. 底部文案
  scene.add.text(36, 668, '峡谷深邃 · 玫瑰红岩 · 古道寻踪', {
    fontFamily: '"Noto Serif SC", "Songti SC", SimSun, serif',
    fontSize: '16px',
    color: '#efe6d8',
  }).setDepth(50).setAlpha(0.72)
}