import Phaser from 'phaser'

const DOME = {
  sky: 0x8ab4cc,       // 明亮的浅蓝天空
  skyDeep: 0x6a98b4,
  gold: 0xd4a338,      // 金顶主色
  goldLight: 0xe8c060, // 金顶高光
  goldDark: 0xb0812a,  // 金顶暗部
  drum: 0x2a4858,      // 鼓座深蓝
  wallWhite: 0xe8e2d4, // 大理石白
  wallShadow: 0xc8c0b0,
  tileGreen: 0x2a6a4a, // 瓷砖绿
  tileBlue: 0x2a4858,  // 瓷砖蓝
  archGold: 0xd4a338,  // 拱门金色窗格
  base: 0xd8d0c0,      // 广场地砖
}

export function paintDome(scene: Phaser.Scene) {
  const W = 1280
  const H = 720
  const g = scene.add.graphics().setDepth(-100)

  // 1. 天空
  g.fillGradientStyle(DOME.sky, DOME.sky, DOME.skyDeep, DOME.skyDeep, 1)
  g.fillRect(0, 0, W, H)

  // 2. 广场地面
  g.fillStyle(DOME.base, 1)
  g.fillRect(0, 550, W, 170)

  // ==========================================
  // 3. 建筑主体
  // ==========================================
  const cx = 640
  const buildingTop = 260
  const buildingW = 760
  const buildingH = 300

  // 3.1 底层大理石白墙（带多边形透视）
  g.fillStyle(DOME.wallWhite, 1)
  g.beginPath()
  g.moveTo(cx - buildingW / 2, buildingTop + 60)
  g.lineTo(cx + buildingW / 2, buildingTop + 60)
  g.lineTo(cx + buildingW / 2 + 40, buildingTop + 60 + buildingH)
  g.lineTo(cx - buildingW / 2 - 40, buildingTop + 60 + buildingH)
  g.closePath()
  g.fillPath()

  // 大理石墙面的阴影/分割线
  g.lineStyle(2, DOME.wallShadow, 0.6)
  for (let i = 1; i < 8; i++) {
    const x = cx - buildingW / 2 + (buildingW / 8) * i
    g.beginPath()
    g.moveTo(x, buildingTop + 60)
    g.lineTo(x + 5, buildingTop + 60 + buildingH)
    g.strokePath()
  }

  // 3.2 墙面上的蓝绿瓷砖拱门
  for (let i = 0; i < 4; i++) {
    const leftX = cx - 280 + i * 140
    
    // 瓷砖底色
    g.fillStyle(i % 2 === 0 ? DOME.tileBlue : DOME.tileGreen, 1)
    g.fillRect(leftX, buildingTop + 80, 100, 160)
    
    // 拱门形状（上半圆）
    g.fillStyle(DOME.goldDark, 1)
    g.beginPath()
    g.arc(leftX + 50, buildingTop + 120, 40, Math.PI, 0, false)
    g.fillRect(leftX + 10, buildingTop + 120, 80, 40)
    g.closePath()
    g.fillPath()
    
    // 金色窗格
    g.fillStyle(DOME.archGold, 0.6)
    g.fillRect(leftX + 20, buildingTop + 120, 60, 100)
  }

  // 中间的大主拱门
  g.fillStyle(DOME.goldDark, 1)
  g.beginPath()
  g.arc(cx, buildingTop + 180, 60, Math.PI, 0, false)
  g.fillRect(cx - 60, buildingTop + 180, 120, 80)
  g.closePath()
  g.fillPath()

  // ==========================================
  // 4. 鼓座（蓝底金纹）
  // ==========================================
  const drumY = buildingTop
  const drumW = 500
  const drumH = 60

  g.fillStyle(DOME.drum, 1)
  g.fillRect(cx - drumW / 2, drumY, drumW, drumH)

  // 鼓座上的几何纹理（金色线条）
  g.lineStyle(2, DOME.gold, 0.5)
  for (let x = cx - drumW / 2 + 20; x < cx + drumW / 2; x += 30) {
    g.strokeRect(x, drumY + 15, 20, 30)
  }

  // ==========================================
  // 5. 金色穹顶
  // ==========================================
  const domeRadius = 200
  
  // 穹顶暗部
  g.fillStyle(DOME.goldDark, 1)
  g.beginPath()
  g.arc(cx, drumY, domeRadius, Math.PI, Math.PI * 2, false)
  g.fillPath()

  // 穹顶亮部
  g.fillStyle(DOME.gold, 1)
  g.beginPath()
  g.arc(cx, drumY - 5, domeRadius - 5, Math.PI, Math.PI * 2, false)
  g.fillPath()

  // 穹顶高光
  g.fillStyle(DOME.goldLight, 0.6)
  g.beginPath()
  g.arc(cx - 60, drumY - 40, 100, Math.PI, Math.PI * 2, false)
  g.fillPath()

  // 顶部月牙
  g.fillStyle(DOME.goldLight, 1)
  g.fillCircle(cx, drumY - domeRadius - 10, 12)
  g.fillStyle(DOME.sky, 1) // 用天空色遮挡出月牙
  g.fillCircle(cx + 5, drumY - domeRadius - 13, 12)

  // 底部文案
  scene.add.text(36, 668, '金穹耀世 · 几何秩序 · 圣境寻光', {
    fontFamily: '"Noto Serif SC", "Songti SC", SimSun, serif',
    fontSize: '16px',
    color: '#5a4a34',
  }).setDepth(50).setAlpha(0.85)
}