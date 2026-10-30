import Phaser from 'phaser'
import {
  WOOD,
  drawWoodSky,
  drawWoodPagoda,
  drawPine,
  drawBush,
  drawStoneSteps,
} from './woodDrawers.ts'

export const WOOD_TEXTURE_KEY = 'wood-bg-static'
const W = 1280
const H = 720

/**
 * 预生成"应县木塔"背景纹理（只跑一次）
 */
export function preloadWoodTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(WOOD_TEXTURE_KEY)) return

  const g = scene.make.graphics({ x: 0, y: 0 }, false)

  // ① 天空 + 远景 + 装饰
  drawWoodSky(g, W, H)

  // ② 远山（两层）
  g.fillStyle(0xa8b8b0, 0.35)
  g.beginPath()
  g.moveTo(-50, 460)
  g.lineTo(160, 340)
  g.lineTo(320, 400)
  g.lineTo(480, 320)
  g.lineTo(640, 380)
  g.lineTo(820, 300)
  g.lineTo(1000, 360)
  g.lineTo(1180, 320)
  g.lineTo(1330, 400)
  g.lineTo(1330, 460)
  g.lineTo(-50, 460)
  g.closePath()
  g.fillPath()

  // ③ 地平线（草地）
  g.fillStyle(WOOD.path, 1)
  g.fillRect(0, 440, W, H - 440)

  // ④ 主塔
  drawWoodPagoda(g, 640, 420)

  // ⑤ 塔前的"石阶"
  drawStoneSteps(g, 640, 420, 3)

  // ⑥ 灌木丛（底部一排）
  for (let i = 0; i < 10; i += 1) {
    const bx = 80 + i * 120
    drawBush(g, bx, 520, 0.9)
  }

  // ⑦ 松柏（左右两侧）
  drawPine(g, 140, 500, 1.1)
  drawPine(g, 220, 480, 0.85)
  drawPine(g, 1080, 500, 1.1)
  drawPine(g, 1150, 480, 0.9)
  drawPine(g, 1010, 470, 0.75)

  // ⑧ 生成纹理
  g.generateTexture(WOOD_TEXTURE_KEY, W, H)
  g.destroy()
}

/**
 * 在场景里显示缓存的背景纹理
 */
export function showWoodBackground(scene: Phaser.Scene) {
  preloadWoodTexture(scene)
  scene.add
    .image(0, 0, WOOD_TEXTURE_KEY)
    .setOrigin(0, 0)
    .setDepth(-100)
}