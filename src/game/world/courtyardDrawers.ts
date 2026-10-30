import Phaser from 'phaser'
import { palette } from '../palette.ts'
import { isoBox } from '../iso.ts'

/**
 * 故宫背景的"元素绘制函数"集合
 * 只负责"画"——不负责预生成纹理、不负责显示
 */

/** 细长松柏（尖顶） */
export function drawPineTall(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1,
) {
  g.fillStyle(palette.shadow, 0.32)
  g.fillEllipse(x + 6, y + 6, 40 * scale, 14 * scale)

  g.fillStyle(palette.timberDark, 1)
  g.fillRect(x - 4 * scale, y - 34 * scale, 8 * scale, 38 * scale)

  g.fillStyle(palette.foliageDark, 1)
  g.fillTriangle(x, y - 96 * scale, x - 30 * scale, y - 32 * scale, x + 30 * scale, y - 32 * scale)

  g.fillStyle(palette.foliage, 1)
  g.fillTriangle(x, y - 118 * scale, x - 24 * scale, y - 54 * scale, x + 24 * scale, y - 54 * scale)

  g.fillStyle(palette.foliageLite, 0.9)
  g.fillTriangle(x, y - 132 * scale, x - 14 * scale, y - 78 * scale, x + 14 * scale, y - 78 * scale)
}

/** 大殿：台基 + 台阶 + 墙身 + 柱门 + 庑殿顶 + 宝顶 */
export function drawHall(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  width: number,
  depth: number,
  height: number,
) {
  const baseH = 22
  const wallH = height

  // 阴影
  g.fillStyle(palette.shadow, 0.3)
  g.fillEllipse(cx + 10, cy + depth * 0.4 + 8, width * 1.3, depth * 1.15)

  // 台基
  isoBox(g, cx, cy, width + 20, depth + 12, baseH, {
    top: palette.stone,
    left: palette.stoneDeep,
    right: palette.stone,
  })

  // 台阶
  const stepBaseY = cy + depth * 0.5 + baseH * 0.6
  for (let i = 0; i < 3; i += 1) {
    const sw = 76 - i * 10
    const sh = 8
    const sy = stepBaseY + i * sh
    g.fillStyle(i % 2 === 0 ? palette.stone : palette.stoneDeep, 1)
    g.beginPath()
    g.moveTo(cx, sy - sh * 0.6)
    g.lineTo(cx + sw / 2, sy)
    g.lineTo(cx, sy + sh * 0.4)
    g.lineTo(cx - sw / 2, sy)
    g.closePath()
    g.fillPath()
  }

  // 墙身
  const bodyY = cy - baseH
  isoBox(g, cx, bodyY, width - 6, depth - 4, wallH, {
    top: palette.wallRed,
    left: palette.wallRedDark,
    right: palette.wallRed,
  })

  // 前脸：门 + 柱
  const frontWallY = bodyY + depth * 0.4
  const wallTopY = frontWallY - wallH
  g.fillStyle(palette.gold, 1)
  g.fillRect(cx - 12, wallTopY + wallH * 0.4, 24, wallH * 0.6)
  g.fillStyle(palette.timberDark, 1)
  g.fillRect(cx - 14, wallTopY + wallH * 0.4, 28, 3)
  g.fillStyle(palette.timberDark, 1)
  g.fillRect(cx - (width - 6) * 0.36, wallTopY, 6, wallH)
  g.fillRect(cx + (width - 6) * 0.36 - 6, wallTopY, 6, wallH)

  // 檐口
  const eaveW = width + 26
  const eaveD = depth + 22
  const eaveH = 12
  const eaveBaseY = bodyY - wallH + 4
  isoBox(g, cx, eaveBaseY + eaveH, eaveW, eaveD, eaveH, {
    top: palette.roofShadow,
    left: palette.roofShadow,
    right: palette.roof,
  })

  // 庑殿顶
  const wallTopY0 = bodyY - wallH
  const roofW = width + 60
  const roofD = depth + 50
  const roofH = 28

  const nX = cx
  const nY = wallTopY0 - roofH
  const eX = cx + roofW / 2
  const eY = wallTopY0 + roofD * 0.5
  const sX = cx
  const sY = wallTopY0 + roofD
  const wX = cx - roofW / 2
  const wY = eY

  const ridgeTop = { x: cx, y: nY - 8 }

  // 左坡
  g.fillStyle(palette.roof, 1)
  g.beginPath()
  g.moveTo(wX, wY)
  g.lineTo(nX, nY)
  g.lineTo(ridgeTop.x, ridgeTop.y)
  g.lineTo(sX, sY)
  g.closePath()
  g.fillPath()

  // 右坡
  g.fillStyle(palette.roofLight, 1)
  g.beginPath()
  g.moveTo(eX, eY)
  g.lineTo(nX, nY)
  g.lineTo(ridgeTop.x, ridgeTop.y)
  g.lineTo(sX, sY)
  g.closePath()
  g.fillPath()

  // 屋脊
  g.fillStyle(palette.roofShadow, 1)
  g.beginPath()
  g.moveTo(nX, nY)
  g.lineTo(ridgeTop.x, ridgeTop.y)
  g.lineTo(sX, sY + 2)
  g.closePath()
  g.fillPath()

  // 金脊线
  g.fillStyle(palette.roofGold, 1)
  g.fillRect(ridgeTop.x - 1, ridgeTop.y, 2, nY - ridgeTop.y + 8)

  // 宝顶
  g.fillStyle(palette.roofGoldLight, 1)
  g.fillCircle(ridgeTop.x, ridgeTop.y - 4, 6)
  g.fillStyle(palette.roofGold, 1)
  g.fillCircle(ridgeTop.x, ridgeTop.y - 4, 3)

  // 屋角飞檐
  g.fillStyle(palette.roofGold, 1)
  g.beginPath()
  g.moveTo(sX, sY)
  g.lineTo(sX - 8, sY - 4)
  g.lineTo(sX - 4, sY + 2)
  g.closePath()
  g.fillPath()
  g.beginPath()
  g.moveTo(sX, sY)
  g.lineTo(sX + 8, sY - 4)
  g.lineTo(sX + 4, sY + 2)
  g.closePath()
  g.fillPath()
}

/** 汉白玉栏杆（沿菱形两边） */
export function drawRailing(
  g: Phaser.GameObjects.Graphics,
  centerX: number,
  centerY: number,
  w: number,
  h: number,
  height = 28,
) {
  const halfW = w / 2
  const halfH = h / 2
  const steps = 8

  // 沿"左上→右下"的边
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const x = centerX + halfW * t
    const y = centerY + halfH * t - halfH * 0.5
    g.fillStyle(palette.stoneDeep, 1)
    g.fillRect(x - 3, y - 6, 6, 6)
    g.fillStyle(palette.cream, 1)
    g.fillRect(x - 2.5, y - height, 5, height)
  }

  // 沿"右上→左下"的边
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const x = centerX + halfW * (1 - t)
    const y = centerY + halfH * t
    g.fillStyle(palette.stoneDeep, 1)
    g.fillRect(x - 3, y - 6, 6, 6)
    g.fillStyle(palette.cream, 1)
    g.fillRect(x - 2.5, y - height, 5, height)
  }

  // 栏板（连接两条边）
  g.lineStyle(3, palette.cream, 0.9)
  g.beginPath()
  g.moveTo(centerX + halfW, centerY - halfH * 0.5)
  g.lineTo(centerX, centerY + halfH)
  g.strokePath()
  g.beginPath()
  g.moveTo(centerX, centerY + halfH)
  g.lineTo(centerX - halfW, centerY - halfH * 0.5)
  g.strokePath()
}