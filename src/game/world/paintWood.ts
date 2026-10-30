import Phaser from 'phaser'
import { showWoodBackground } from './woodTexture.ts'

/**
 * 绘制"应县木塔"背景
 * 使用预生成纹理（woodTexture），首次渲染后缓存复用。
 * 底部装饰文字单独绘制（Graphics 不支持文字）。
 */
export function paintWood(scene: Phaser.Scene) {
  showWoodBackground(scene)

  scene.add
    .text(36, 668, '木塔千年 · 斗拱承天 · 材构有序', {
      fontFamily: '"Noto Serif SC", "Songti SC", SimSun, serif',
      fontSize: '16px',
      color: '#efe6d8',
    })
    .setDepth(50)
    .setAlpha(0.72)
}