import Phaser from 'phaser'

const SAND = {
  sky: 0xf3d8b0,
  skyDeep: 0xe0c090,
  sand: 0xd8b880,
  pyramid: 0xe8c878,
  pyramidShade: 0xc8a858,
}

export function drawDesertSky(g: Phaser.GameObjects.Graphics, W: number, H: number) {
  g.fillGradientStyle(SAND.sky, SAND.sky, SAND.skyDeep, SAND.skyDeep, 1)
  g.fillRect(0, 0, W, H)
  g.fillStyle(0xe8d8a8, 0.4)
  g.beginPath(); g.moveTo(300, 420); g.lineTo(500, 180); g.lineTo(700, 420); g.closePath(); g.fillPath()
  g.beginPath(); g.moveTo(600, 420); g.lineTo(750, 240); g.lineTo(900, 420); g.closePath(); g.fillPath()
}

export function drawPyramid(g: Phaser.GameObjects.Graphics, cx: number, baseY: number) {
  g.fillStyle(SAND.sand, 1); g.fillRect(0, 420, 1280, 300)
  g.fillStyle(SAND.pyramid, 1)
  g.beginPath(); g.moveTo(cx, 80); g.lineTo(cx + 260, baseY); g.lineTo(cx - 260, baseY); g.closePath(); g.fillPath()
  g.fillStyle(SAND.pyramidShade, 1)
  g.beginPath(); g.moveTo(cx, 80); g.lineTo(cx + 260, baseY); g.lineTo(cx, baseY); g.closePath(); g.fillPath()
}