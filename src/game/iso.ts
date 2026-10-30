import Phaser from 'phaser'

export const TILE_W = 72
export const TILE_H = 36

export const ISO_ORIGIN = { x: 640, y: 168 }

export function isoToScreen(tx: number, ty: number, origin = ISO_ORIGIN) {
  return {
    x: origin.x + (tx - ty) * (TILE_W / 2),
    y: origin.y + (tx + ty) * (TILE_H / 2),
  }
}

export function diamond(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  alpha = 1,
) {
  g.fillStyle(color, alpha)
  g.beginPath()
  g.moveTo(x, y - h / 2)
  g.lineTo(x + w / 2, y)
  g.lineTo(x, y + h / 2)
  g.lineTo(x - w / 2, y)
  g.closePath()
  g.fillPath()
}

export function strokeDiamond(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  alpha = 0.35,
  width = 1,
) {
  g.lineStyle(width, color, alpha)
  g.beginPath()
  g.moveTo(x, y - h / 2)
  g.lineTo(x + w / 2, y)
  g.lineTo(x, y + h / 2)
  g.lineTo(x - w / 2, y)
  g.closePath()
  g.strokePath()
}

export function isoBox(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  d: number,
  h: number,
  colors: { top: number; left: number; right: number },
) {
  const topY = y - h
  const n = { x, y: topY }
  const e = { x: x + w / 2, y: topY + d / 2 }
  const s = { x, y: topY + d }
  const west = { x: x - w / 2, y: topY + d / 2 }
  const sBottom = { x: s.x, y: s.y + h }
  const eBottom = { x: e.x, y: e.y + h }
  const wBottom = { x: west.x, y: west.y + h }

  g.fillStyle(colors.left, 1)
  g.beginPath()
  g.moveTo(west.x, west.y)
  g.lineTo(s.x, s.y)
  g.lineTo(sBottom.x, sBottom.y)
  g.lineTo(wBottom.x, wBottom.y)
  g.closePath()
  g.fillPath()

  g.fillStyle(colors.right, 1)
  g.beginPath()
  g.moveTo(e.x, e.y)
  g.lineTo(s.x, s.y)
  g.lineTo(sBottom.x, sBottom.y)
  g.lineTo(eBottom.x, eBottom.y)
  g.closePath()
  g.fillPath()

  g.fillStyle(colors.top, 1)
  g.beginPath()
  g.moveTo(n.x, n.y)
  g.lineTo(e.x, e.y)
  g.lineTo(s.x, s.y)
  g.lineTo(west.x, west.y)
  g.closePath()
  g.fillPath()
}
