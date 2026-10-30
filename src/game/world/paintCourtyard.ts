import Phaser from 'phaser'
import { showCourtyardBackground } from './courtyardTexture.ts'

export function paintCourtyard(scene: Phaser.Scene) {
  showCourtyardBackground(scene)

  scene.add
    .text(36, 668, '中轴为纲 · 院落为序 · 礼制为心', {
      fontFamily: '"Noto Serif SC", "Songti SC", SimSun, serif',
      fontSize: '16px',
      color: '#efe6d8',
    })
    .setDepth(50)
    .setAlpha(0.72)
}