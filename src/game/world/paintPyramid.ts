import Phaser from 'phaser'
import { showPyramidBackground } from './pyramidTexture.ts'

export function paintPyramid(scene: Phaser.Scene) {
  showPyramidBackground(scene)
  scene.add.text(36, 668, '黄沙漫卷 · 巨碑接天 · 星辰引路', {
    fontFamily: '"Noto Serif SC", serif',
    fontSize: '16px',
    color: '#efe6d8',
  }).setDepth(50).setAlpha(0.72)
}