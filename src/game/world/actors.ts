import Phaser from 'phaser'
import { isoToScreen } from '../iso.ts'
import { palette, UI_FONT } from '../palette.ts'
import type { ClueConfig, NpcConfig } from '../types.ts'

export function createNpc(scene: Phaser.Scene, npc: NpcConfig) {
  const p = isoToScreen(npc.position.tx, npc.position.ty)
  const root = scene.add.container(p.x, p.y).setDepth(p.y + 20)

  const body = scene.add.graphics()
  body.fillStyle(palette.shadow, 0.3)
  body.fillEllipse(6, 12, 46, 16)
  body.fillStyle(palette.clay, 1)
  body.fillEllipse(0, -18, 36, 52)
  body.fillStyle(palette.timber, 1)
  body.fillTriangle(-18, -8, 18, -8, 0, 18)
  body.fillStyle(palette.rose, 1)
  body.fillCircle(0, -48, 14)
  body.fillStyle(palette.ink, 1)
  body.fillEllipse(0, -56, 22, 14)
  body.fillCircle(-16, -44, 3)
  root.add(body)

  const label = scene.add
    .text(0, 26, `${npc.name} · ${npc.title}`, {
      fontFamily: UI_FONT,
      fontSize: '14px',
      color: '#f3ece1',
      backgroundColor: '#4a453fcc',
      padding: { x: 8, y: 4 },
    })
    .setOrigin(0.5, 0)
  root.add(label)

  root.setSize(70, 110)
  root.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(-35, -80, 70, 110),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
  })

  scene.tweens.add({
    targets: root,
    y: p.y - 4,
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut',
  })

  return root
}

export function createClue(scene: Phaser.Scene, clue: ClueConfig) {
  const p = isoToScreen(clue.position.tx, clue.position.ty)
  const root = scene.add.container(p.x, p.y).setDepth(p.y + 16)

  const mark = scene.add.graphics()
  mark.fillStyle(palette.shadow, 0.28)
  mark.fillEllipse(4, 10, 42, 14)
  mark.fillStyle(palette.gold, 1)
  mark.fillTriangle(0, -38, -22, 4, 22, 4)
  mark.fillStyle(palette.cream, 1)
  mark.fillCircle(0, -10, 10)
  root.add(mark)

  const label = scene.add
    .text(0, 18, clue.name, {
      fontFamily: UI_FONT,
      fontSize: '13px',
      color: '#4a453f',
      backgroundColor: '#efe6d8ee',
      padding: { x: 7, y: 3 },
    })
    .setOrigin(0.5, 0)
  root.add(label)

  root.setSize(56, 70)
  root.setInteractive({
    hitArea: new Phaser.Geom.Rectangle(-28, -44, 56, 70),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor: true,
  })

  scene.tweens.add({
    targets: root,
    y: p.y - 6,
    duration: 1200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut',
  })

  return root
}
