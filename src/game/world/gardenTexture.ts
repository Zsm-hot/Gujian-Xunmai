import Phaser from 'phaser'
import {
  drawPond,
  drawRock,
  drawWillow,
  drawFlowerTree,
  drawPavilion,
  drawBridge,
  drawMoonGate,
  drawStonePath,
} from './gardenDrawers.ts'

export const GARDEN_TEXTURE_KEY = 'garden-bg-static'
const W = 1280
const H = 720

/**
 * 预生成"江南庭院"背景纹理（只跑一次）
 */
export function preloadGardenTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(GARDEN_TEXTURE_KEY)) return

  const g = scene.make.graphics({ x: 0, y: 0 }, false)

  // ============ 天空 ============
  // 江南青灰调（比故宫更淡、更青）
  g.fillGradientStyle(0xd8e0dc, 0xd8e0dc, 0xc0ccc4, 0xa8b8b0, 1)
  g.fillRect(0, 0, W, H)

  // 远处的山影（淡青灰）
  g.fillStyle(0xb0c0b8, 0.4)
  g.fillEllipse(300, 180, 380, 100)
  g.fillStyle(0xa8b8b0, 0.35)
  g.fillEllipse(1000, 160, 420, 110)

  // ============ 地面（青绿草地）===========
  const hash = (tx: number, ty: number) => ((tx * 13 + ty * 29) % 7) / 7
  const TILE_W = 72
  const TILE_H = 36
  const ISO_ORIGIN = { x: 640, y: 168 }

  const isoToScreen = (tx: number, ty: number) => ({
    x: ISO_ORIGIN.x + (tx - ty) * (TILE_W / 2),
    y: ISO_ORIGIN.y + (tx + ty) * (TILE_H / 2),
  })

  const diamond = (
    x: number, y: number, w: number, h: number, color: number, alpha: number,
  ) => {
    g.fillStyle(color, alpha)
    g.beginPath()
    g.moveTo(x, y - h / 2)
    g.lineTo(x + w / 2, y)
    g.lineTo(x, y + h / 2)
    g.lineTo(x - w / 2, y)
    g.closePath()
    g.fillPath()
  }

  for (let ty = 0; ty < 16; ty += 1) {
    for (let tx = 0; tx < 16; tx += 1) {
      const p = isoToScreen(tx, ty)
      // 江南草色：青绿 + 黄绿
      const tint = hash(tx, ty) > 0.55 ? 0x9aae88 : 0x8a9e78
      diamond(p.x, p.y, TILE_W + 2, TILE_H + 1, tint, 0.95)
    }
  }

  // ============ 石板路（从下方到水池）===========
  // 主路：从画面底部中央到水池前
  drawStonePath(g, [
    [640, 640],
    [640, 560],
    [620, 480],
    [600, 420],
  ])

  // 侧路：从月洞门到水池
  drawStonePath(g, [
    [300, 400],
    [420, 380],
    [520, 400],
  ])

  // ============ 水池（居中）===========
  drawPond(g, 640, 400)

  // ============ 假山（水池边）===========
  drawRock(g, 480, 380, 1.2)
  drawRock(g, 800, 420, 1.0)
  drawRock(g, 720, 480, 0.8)

  // ============ 廊桥（跨过水池）===========
  drawBridge(g, 520, 420, 760, 360)

  // ============ 亭子（左上方）===========
  drawPavilion(g, 350, 280, 110, 60)

  // ============ 月洞门（左侧）===========
  drawMoonGate(g, 200, 400, 140, 120)

  // ============ 花树（粉红 + 黄色）===========
  drawFlowerTree(g, 300, 500, 1.2)
  drawFlowerTree(g, 900, 280, 1.0)
  drawFlowerTree(g, 1050, 460, 1.1)
  drawFlowerTree(g, 180, 560, 0.9)

  // ============ 垂柳（右侧 + 底部）===========
  drawWillow(g, 1000, 550, 1.1)
  drawWillow(g, 450, 600, 0.9)
  drawWillow(g, 850, 620, 1.0)

  // ============ 底部青苔/石缝装饰 ============
  g.fillStyle(0x6a7a5a, 0.4)
  g.fillEllipse(200, 660, 80, 20)
  g.fillEllipse(1100, 660, 100, 22)

  // ============ 生成纹理 ============
  g.generateTexture(GARDEN_TEXTURE_KEY, W, H)
  g.destroy()
}

/** 在场景里显示缓存的背景纹理 */
export function showGardenBackground(scene: Phaser.Scene) {
  preloadGardenTexture(scene)
  scene.add
    .image(0, 0, GARDEN_TEXTURE_KEY)
    .setOrigin(0, 0)
    .setDepth(-100)
}