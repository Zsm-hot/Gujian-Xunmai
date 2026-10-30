import Phaser from 'phaser'
import { drawDesertSky, drawPyramid } from './pyramidDrawers.ts'

export const PYRAMID_TEXTURE_KEY = 'pyramid-bg-static'
const W = 1280
const H = 720

export function preloadPyramidTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(PYRAMID_TEXTURE_KEY)) return
  const g = scene.make.graphics({ x: 0, y: 0 }, false)
  drawDesertSky(g, W, H)
  drawPyramid(g, 640, 480)
  g.generateTexture(PYRAMID_TEXTURE_KEY, W, H)
  g.destroy()
}

export function showPyramidBackground(scene: Phaser.Scene) {
  preloadPyramidTexture(scene)
  scene.add.image(0, 0, PYRAMID_TEXTURE_KEY).setOrigin(0, 0).setDepth(-100)
}