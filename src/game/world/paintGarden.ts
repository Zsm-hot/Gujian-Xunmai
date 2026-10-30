import Phaser from 'phaser'
import { showGardenBackground } from './gardenTexture.ts'

/**
 * 绘制"江南庭院"背景
 * 使用预生成纹理（gardenTexture），首次渲染后缓存复用。
 * 底部装饰文字单独绘制（Graphics 不支持文字）。
 */
export function paintGarden(scene: Phaser.Scene) {
  // 主背景
  showGardenBackground(scene)

  // 底部文案
  scene.add
    .text(36, 668, '粉墙黛瓦 · 曲水回廊 · 万物安居', {
      fontFamily: '"Noto Serif SC", "Songti SC", SimSun, serif',
      fontSize: '16px',
      color: '#efe6d8',
    })
    .setDepth(50)
    .setAlpha(0.72)
}