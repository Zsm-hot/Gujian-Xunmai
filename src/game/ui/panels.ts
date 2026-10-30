import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'

export function roundedPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: number = palette.panel,
) {
  const g = scene.add.graphics()
  g.fillStyle(fill, 0.94)
  g.fillRoundedRect(x, y, width, height, 14)
  g.lineStyle(2, palette.gold, 0.55)
  g.strokeRoundedRect(x, y, width, height, 14)
  return g
}

export function textButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
) {
  const width = 220
  const height = 48
  const root = scene.add.container(x, y)
  const bg = scene.add.graphics()
  bg.fillStyle(palette.timber, 1)
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10)
  bg.lineStyle(1, palette.gold, 0.7)
  bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10)
  const t = scene.add
    .text(0, 0, label, {
      fontFamily: UI_FONT,
      fontSize: '20px',
      color: '#f3ece1',
    })
    .setOrigin(0.5)
  root.add([bg, t])
  root.setSize(width, height)
  root.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
  })
  root.on('pointerover', () => bg.setAlpha(0.86))
  root.on('pointerout', () => bg.setAlpha(1))
  root.on('pointerup', onClick)
  return root
}
