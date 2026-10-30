import type { PuzzlePiece, PuzzleSlot } from '../../ui/DragPuzzleInteraction.ts'
import Phaser from 'phaser'

const EGYPT = {
  sand: 0xd8b880,         // 沙色
  stone: 0xc8b088,        // 石板底色
  stoneDark: 0x8a7050,    // 石板阴影
  gold: 0xd4a338,         // 金色符号
  blue: 0x2a4858,         // 埃及蓝（某些符号用）
}

const SLOT_W = 60
const SLOT_H = 60

/** 绘制：埃及象形符号（简化） */
function drawHieroglyph(g: Phaser.GameObjects.Graphics, id: string) {
  g.lineStyle(4, EGYPT.gold, 1)
  g.fillStyle(EGYPT.gold, 1)

  if (id === 'eye') {
    // 荷鲁斯之眼
    g.strokeEllipse(0, 0, 30, 16)
    g.fillCircle(0, 0, 6)
    g.beginPath()
    g.moveTo(0, 8)
    g.lineTo(-8, 20)
    g.strokePath()
  } else if (id === 'ankh') {
    // 生命十字
    g.strokeCircle(0, -10, 8)
    g.fillRect(-3, -2, 6, 20)
    g.fillRect(-14, 4, 28, 6)
  } else if (id === 'scarab') {
    // 圣甲虫
    g.fillCircle(0, 0, 10)
    g.strokeEllipse(0, 0, 24, 30)
    g.beginPath(); g.moveTo(-12, 0); g.lineTo(-18, -8); g.strokePath();
    g.beginPath(); g.moveTo(12, 0); g.lineTo(18, -8); g.strokePath();
  } else if (id === 'sun') {
    // 太阳
    g.strokeCircle(0, 0, 14)
    g.fillCircle(0, 0, 6)
  }
}

// 4 块壁画（位置计算）

// 构造 4 个 Slot（壁画上的空缺）
// 构造 4 个 Slot（壁画上的空缺）
export const egyptMuralSlots: PuzzleSlot[] = [
  { id: 'slot-1', x: 460, y: 280, w: SLOT_W, h: SLOT_H },  // 左上
  { id: 'slot-2', x: 820, y: 280, w: SLOT_W, h: SLOT_H },  // 右上
  { id: 'slot-3', x: 460, y: 440, w: SLOT_W, h: SLOT_H },  // 左下
  { id: 'slot-4', x: 820, y: 440, w: SLOT_W, h: SLOT_H },  // 右下
]

// 构造 4 个 Piece（符号）
const glyphList = ['eye', 'ankh', 'scarab', 'sun']

export const egyptMuralPieces: PuzzlePiece[] = glyphList.map((glyph, i) => ({
  id: `piece-${i + 1}`,
  slotId: `slot-${i + 1}`,
  drawFn: (g) => drawHieroglyph(g, glyph),
}))

// 碎片初始位置（打乱）
export const egyptMuralHomePositions = egyptMuralPieces.map((_, i) => ({
  x: 640 - (4 * 80) / 2 + i * 80 + 40,
  y: 560,
})).sort(() => Math.random() - 0.5)