import Phaser from 'phaser'
import { isoBox } from '../iso.ts'

// ===== 江南园林专用配色 =====
const GARDEN = {
  // 水面
  water: 0x7ea8b8,       // 池水主色（青蓝）
  waterDeep: 0x5a7f8e,   // 池水深
  waterLite: 0xa8c8d0,   // 池水亮
  waterEdge: 0xd8d0c0,   // 池岸石边

  // 白墙黛瓦
  wallWhite: 0xe8e2d4,   // 粉墙
  wallShadow: 0xc8c0b0,  // 墙阴影
  roofTile: 0x4a5058,    // 黛瓦
  roofTileLight: 0x606870,
  roofTileDark: 0x353a42,

  // 木材
  wood: 0x8a5a3a,        // 木柱
  woodDark: 0x5a3a24,    // 木梁

  // 绿植
  leaf: 0x5a7a4a,        // 叶子
  leafDark: 0x3a5a30,    // 叶深
  leafLite: 0x7a9a5a,    // 叶亮
  blossom: 0xe8a0b0,     // 花（粉）
  blossom2: 0xe8c060,    // 花（黄）

  // 石
  stone: 0xb8b0a0,       // 石头
  stoneDark: 0x8a8272,   // 石头深
  stoneLite: 0xd8d0c0,   // 石头亮
  path: 0xd8d0c0,        // 石板路

  // 假山（青灰）
  rock: 0x8a98a0,
  rockDark: 0x606e78,
  rockLite: 0xb0bcc4,

  // 阴影
  shadow: 0x4a5a60,
}

// ===== 绘制：水池（不规则多边形） =====
export function drawPond(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
) {
  // 阴影
  g.fillStyle(GARDEN.shadow, 0.2)
  g.fillEllipse(cx + 8, cy + 10, 420, 260)

  // 池岸（外圈）
  g.fillStyle(GARDEN.stoneLite, 0.9)
  g.fillEllipse(cx, cy, 440, 280)
  g.lineStyle(2, GARDEN.stoneDark, 0.5)
  g.strokeEllipse(cx, cy, 440, 280)

  // 池水（内圈，深色）
  g.fillStyle(GARDEN.waterDeep, 1)
  g.fillEllipse(cx, cy + 2, 420, 260)

  // 池水（主色）
  g.fillStyle(GARDEN.water, 1)
  g.fillEllipse(cx, cy - 2, 400, 244)

  // 池水（亮面）
  g.fillStyle(GARDEN.waterLite, 0.4)
  g.fillEllipse(cx - 60, cy - 30, 200, 80)
  g.fillEllipse(cx + 80, cy + 20, 140, 60)
}

// ===== 绘制：假山（青灰不规则块） =====
export function drawRock(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  scale = 1,
) {
  g.fillStyle(GARDEN.shadow, 0.25)
  g.fillEllipse(cx + 6, cy + 8 * scale, 70 * scale, 24 * scale)

  // 主石
  g.fillStyle(GARDEN.rock, 1)
  g.beginPath()
  g.moveTo(cx - 32 * scale, cy + 6 * scale)
  g.lineTo(cx - 22 * scale, cy - 28 * scale)
  g.lineTo(cx - 6 * scale, cy - 38 * scale)
  g.lineTo(cx + 12 * scale, cy - 32 * scale)
  g.lineTo(cx + 28 * scale, cy - 12 * scale)
  g.lineTo(cx + 30 * scale, cy + 6 * scale)
  g.closePath()
  g.fillPath()

  // 亮面
  g.fillStyle(GARDEN.rockLite, 0.7)
  g.beginPath()
  g.moveTo(cx - 16 * scale, cy - 20 * scale)
  g.lineTo(cx - 4 * scale, cy - 32 * scale)
  g.lineTo(cx + 8 * scale, cy - 24 * scale)
  g.lineTo(cx - 4 * scale, cy - 12 * scale)
  g.closePath()
  g.fillPath()

  // 暗面
  g.fillStyle(GARDEN.rockDark, 0.6)
  g.beginPath()
  g.moveTo(cx + 8 * scale, cy - 18 * scale)
  g.lineTo(cx + 24 * scale, cy - 10 * scale)
  g.lineTo(cx + 28 * scale, cy + 4 * scale)
  g.lineTo(cx + 6 * scale, cy + 4 * scale)
  g.closePath()
  g.fillPath()
}

// ===== 绘制：垂柳 =====
export function drawWillow(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1,
) {
  // 阴影
  g.fillStyle(GARDEN.shadow, 0.25)
  g.fillEllipse(x + 6, y + 4, 60 * scale, 18 * scale)

  // 树干
  g.fillStyle(GARDEN.woodDark, 1)
  g.fillRect(x - 5 * scale, y - 40 * scale, 10 * scale, 44 * scale)

  // 枝条（下垂的曲线）
  g.lineStyle(2 * scale, GARDEN.leafDark, 0.9)
  for (let i = 0; i < 5; i += 1) {
    const dx = (i - 2) * 12 * scale
    g.beginPath()
    g.moveTo(x + dx * 0.4, y - 40 * scale)
    g.lineTo(x + dx, y - 20 * scale)
    g.lineTo(x + dx + 4 * scale, y - 5 * scale)
    g.strokePath()
  }

  // 叶子（一团绿）
  g.fillStyle(GARDEN.leafDark, 1)
  g.fillEllipse(x, y - 50 * scale, 70 * scale, 40 * scale)
  g.fillStyle(GARDEN.leaf, 1)
  g.fillEllipse(x + 6 * scale, y - 54 * scale, 60 * scale, 32 * scale)
  g.fillStyle(GARDEN.leafLite, 0.85)
  g.fillEllipse(x - 4 * scale, y - 60 * scale, 40 * scale, 22 * scale)
}

// ===== 绘制：花树（桃/梅） =====
export function drawFlowerTree(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1,
) {
  g.fillStyle(GARDEN.shadow, 0.25)
  g.fillEllipse(x + 6, y + 4, 60 * scale, 18 * scale)

  // 树干
  g.fillStyle(GARDEN.woodDark, 1)
  g.fillRect(x - 5 * scale, y - 36 * scale, 10 * scale, 40 * scale)

  // 树冠（绿）
  g.fillStyle(GARDEN.leafDark, 1)
  g.fillEllipse(x - 8 * scale, y - 52 * scale, 60 * scale, 38 * scale)
  g.fillStyle(GARDEN.leaf, 1)
  g.fillEllipse(x + 8 * scale, y - 56 * scale, 64 * scale, 40 * scale)

  // 花朵（点状粉/黄）
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2
    const r = 22 * scale
    const fx = x + Math.cos(a) * r
    const fy = y - 56 * scale + Math.sin(a) * r * 0.5
    g.fillStyle(i % 2 === 0 ? GARDEN.blossom : GARDEN.blossom2, 0.9)
    g.fillCircle(fx, fy, 3 * scale)
  }
}

// ===== 绘制：亭子（八角或四方） =====
export function drawPavilion(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w = 100,
  h = 60,
) {
  // 阴影
  g.fillStyle(GARDEN.shadow, 0.28)
  g.fillEllipse(cx + 8, cy + 30, w * 1.3, 24)

  // 台基
  isoBox(g, cx, cy + 30, w + 16, h * 0.5 + 10, 14, {
    top: GARDEN.stoneLite,
    left: GARDEN.stoneDark,
    right: GARDEN.stone,
  })

  // 木柱（4 根）
  g.fillStyle(GARDEN.wood, 1)
  const colPositions = [
    { x: -w / 2 + 8, y: 0 },
    { x: w / 2 - 8, y: 0 },
    { x: -w / 2 + 8, y: 30 },
    { x: w / 2 - 8, y: 30 },
  ]
  for (const p of colPositions) {
    g.fillRect(cx + p.x - 3, cy - 30 + p.y, 6, 40)
  }

  // 屋顶（简化为两层）
  // 底层屋檐
  g.fillStyle(GARDEN.roofTile, 1)
  g.beginPath()
  g.moveTo(cx - w / 2 - 16, cy - 30)
  g.lineTo(cx + w / 2 + 16, cy - 30)
  g.lineTo(cx + w / 2 + 4, cy - 44)
  g.lineTo(cx - w / 2 - 4, cy - 44)
  g.closePath()
  g.fillPath()

  // 顶层
  g.fillStyle(GARDEN.roofTileDark, 1)
  g.beginPath()
  g.moveTo(cx - w / 2 - 4, cy - 44)
  g.lineTo(cx + w / 2 + 4, cy - 44)
  g.lineTo(cx, cy - 70)
  g.closePath()
  g.fillPath()

  // 屋脊
  g.fillStyle(GARDEN.roofTileLight, 1)
  g.fillRect(cx - 1, cy - 70, 2, 8)

  // 顶珠
  g.fillStyle(0xd4a338, 1)
  g.fillCircle(cx, cy - 74, 4)
}

// ===== 绘制：廊桥 =====
export function drawBridge(
  g: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2 - 20

  // 桥面
  g.lineStyle(14, GARDEN.wood, 1)
  g.beginPath()
  g.moveTo(x1, y1)
  g.lineTo(mx, my)
  g.lineTo(x2, y2)
  g.strokePath()

  // 桥面高光
  g.lineStyle(2, GARDEN.woodDark, 0.6)
  g.beginPath()
  g.moveTo(x1, y1 - 4)
  g.lineTo(mx, my - 4)
  g.lineTo(x2, y2 - 4)
  g.strokePath()

  // 桥栏
  g.lineStyle(2, GARDEN.woodDark, 0.9)
  g.beginPath()
  g.moveTo(x1, y1 - 12)
  g.lineTo(mx, my - 12)
  g.lineTo(x2, y2 - 12)
  g.strokePath()
}

// ===== 绘制：月洞门（白墙 + 圆洞） =====
export function drawMoonGate(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w = 120,
  h = 100,
) {
  // 白墙
  g.fillStyle(GARDEN.wallWhite, 1)
  g.fillRect(cx - w / 2, cy - h / 2, w, h)

  // 墙顶瓦（黛瓦）
  g.fillStyle(GARDEN.roofTile, 1)
  g.fillRect(cx - w / 2 - 6, cy - h / 2 - 8, w + 12, 8)
  g.fillStyle(GARDEN.roofTileLight, 1)
  g.fillRect(cx - w / 2 - 6, cy - h / 2 - 10, w + 12, 3)

  // 圆洞门（挖空）
  g.fillStyle(GARDEN.wallShadow, 1)
  g.fillCircle(cx, cy, 30)
  g.fillStyle(0x2a3038, 1)
  g.fillCircle(cx, cy, 26)

  // 门框（深色）
  g.lineStyle(3, GARDEN.roofTileDark, 1)
  g.strokeCircle(cx, cy, 30)
}

// ===== 绘制：石板路 =====
export function drawStonePath(
  g: Phaser.GameObjects.Graphics,
  points: [number, number][],
) {
  // 连接成一条石板路
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2

    // 每段路画 4 块石板
    for (let t = 0; t < 1; t += 0.25) {
      const x = x1 + (x2 - x1) * t
      const y = y1 + (y2 - y1) * t
      g.fillStyle(GARDEN.path, 0.95)
      g.fillEllipse(x, y, 20, 10)
      g.lineStyle(1, GARDEN.stoneDark, 0.4)
      g.strokeEllipse(x, y, 20, 10)
    }
    // 加一个中间点
    g.fillStyle(GARDEN.path, 0.95)
    g.fillEllipse(mx, my, 20, 10)
  }
}

export { GARDEN }