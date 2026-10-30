import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from './panels.ts'
import type { KnowledgeCard } from '../types.ts'

const DEPTH_BG = 5000
const DEPTH_PANEL = 5001
const DEPTH_TEXT = 5002

/**
 * 知识卡弹窗
 * 显示一张居中的科普卡片，底部有"继续"按钮。
 * onContinue 是点击"继续"后调用的回调。
 */
export function showKnowledgeCard(
  scene: Phaser.Scene,
  card: KnowledgeCard,
  onContinue: () => void,
) {
  const overlay = scene.add
    .rectangle(640, 360, 1280, 720, palette.ink, 0.62)
    .setDepth(DEPTH_BG)

  roundedPanel(scene, 220, 140, 840, 440, palette.panel).setDepth(DEPTH_PANEL)

  // 顶部装饰线
  const deco = scene.add.graphics().setDepth(DEPTH_TEXT)
  deco.lineStyle(2, palette.gold, 0.5)
  deco.beginPath()
  deco.moveTo(300, 200)
  deco.lineTo(980, 200)
  deco.strokePath()

  // 标签
  scene.add
    .text(640, 178, '知 识 卡', {
      fontFamily: UI_FONT,
      fontSize: '16px',
      color: '#b09a6e',
    })
    .setOrigin(0.5)
    .setDepth(DEPTH_TEXT)

  // 标题
  scene.add
    .text(640, 240, card.title, {
      fontFamily: UI_FONT,
      fontSize: '28px',
      color: '#4a453f',
    })
    .setOrigin(0.5)
    .setDepth(DEPTH_TEXT)

  // 正文
  scene.add
    .text(640, 300, card.content, {
      fontFamily: UI_FONT,
      fontSize: '18px',
      color: '#5a5148',
      wordWrap: { width: 640, useAdvancedWrap: true },
      align: 'left',
      lineSpacing: 10,
    })
    .setOrigin(0.5, 0)
    .setDepth(DEPTH_TEXT)

  // 出处
  if (card.source) {
  scene.add
    .text(640, 300, card.content, {
      fontFamily: UI_FONT,
      fontSize: '18px',
      color: '#5a5148',
      wordWrap: { width: 640, useAdvancedWrap: true },
      align: 'left',
      lineSpacing: 10,
    })
    .setOrigin(0.5, 0)
    .setDepth(DEPTH_TEXT)

  // 继续按钮
  textButton(scene, 640, 550, '继 续', () => {
    overlay.destroy()
    // 清掉面板和文字（按 depth 批量清理）
scene.children.list
  .filter((obj) => {
    const d = (obj as { depth?: number }).depth
    return d === DEPTH_PANEL || d === DEPTH_TEXT
  })
  .forEach((obj) => obj.destroy())
    onContinue()
  }).setDepth(DEPTH_TEXT + 1)
}}