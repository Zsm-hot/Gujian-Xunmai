import Phaser from 'phaser'
import { palette } from '../palette.ts'
import { diamond, isoToScreen, strokeDiamond, TILE_H, TILE_W } from '../iso.ts'
import { drawHall, drawPineTall, drawRailing } from './courtyardDrawers.ts'

export const COURTYARD_TEXTURE_KEY = 'courtyard-bg-static'
const W = 1280
const H = 720

export function preloadCourtyardTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(COURTYARD_TEXTURE_KEY)) return

  const g = scene.make.graphics({ x: 0, y: 0 }, false)

  // 天空
  g.fillGradientStyle(palette.sky, palette.sky, palette.skyDeep, palette.mist, 1)
  g.fillRect(0, 0, W, H)
  g.fillStyle(palette.sage, 0.28)
  g.fillEllipse(220, 150, 420, 90)
  g.fillStyle(palette.moss, 0.22)
  g.fillEllipse(980, 128, 380, 80)

  // 地面
  const hash = (tx: number, ty: number) => ((tx * 13 + ty * 29) % 7) / 7
  for (let ty = 0; ty < 16; ty += 1) {
    for (let tx = 0; tx < 16; tx += 1) {
      const p = isoToScreen(tx, ty)
      const tint = hash(tx, ty) > 0.55 ? palette.lawn : palette.lawnDeep
      diamond(g, p.x, p.y, TILE_W + 2, TILE_H + 1, tint, 0.98)
      strokeDiamond(g, p.x, p.y, TILE_W + 2, TILE_H + 1, palette.stoneDeep, 0.15)
    }
  }

  // 御道
  for (let ty = 3; ty < 15; ty += 1) {
    for (let tx = 7; tx <= 8; tx += 1) {
      const p = isoToScreen(tx, ty)
      diamond(g, p.x, p.y, TILE_W - 6, TILE_H - 4, palette.path, 1)
      strokeDiamond(g, p.x, p.y, TILE_W - 6, TILE_H - 4, palette.pathEdge, 0.5)
    }
  }
  for (let ty = 4; ty < 14; ty += 2) {
    const p = isoToScreen(7.5, ty)
    diamond(g, p.x, p.y - 2, 22, 12, palette.stone, 0.65)
  }

  // 广场
  const plazaCenter = isoToScreen(11, 8)
  diamond(g, plazaCenter.x, plazaCenter.y, 220, 110, palette.stone, 1)
  strokeDiamond(g, plazaCenter.x, plazaCenter.y, 220, 110, palette.stoneDeep, 0.6)
  drawRailing(g, plazaCenter.x, plazaCenter.y, 220, 110, 28)

  // 两座大殿
  const hall2 = isoToScreen(5.4, 5.4)
  drawHall(g, hall2.x, hall2.y, 130, 60, 50)
  const hall1 = isoToScreen(8.0, 9.6)
  drawHall(g, hall1.x, hall1.y, 170, 76, 62)

  // 松柏
  drawPineTall(g, isoToScreen(2.4, 11.4).x, isoToScreen(2.4, 11.4).y, 0.9)
  drawPineTall(g, isoToScreen(2.6, 9.0).x, isoToScreen(2.6, 9.0).y, 0.75)
  drawPineTall(g, isoToScreen(13.0, 11.8).x, isoToScreen(13.0, 11.8).y, 0.85)
  drawPineTall(g, isoToScreen(13.2, 4.4).x, isoToScreen(13.2, 4.4).y, 0.7)
  drawPineTall(g, isoToScreen(1.6, 4.6).x, isoToScreen(1.6, 4.6).y, 0.8)

  // 生成纹理
  g.generateTexture(COURTYARD_TEXTURE_KEY, W, H)
  g.destroy()
}

export function showCourtyardBackground(scene: Phaser.Scene) {
  preloadCourtyardTexture(scene)
  scene.add.image(0, 0, COURTYARD_TEXTURE_KEY).setOrigin(0, 0).setDepth(-100)
}