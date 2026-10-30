import type { PuzzlePiece, PuzzleSlot } from '../../ui/DragPuzzleInteraction.ts'
import Phaser from 'phaser'

// ===== 颜色 =====
const WOOD = 0x8a4a2a   // 深木色线条
const RED = 0xa83232    // 朱红线条
const CREAM = 0xe8dcc0  // 镂空背景色

// ===== 尺寸 =====
const PIECE_W = 60
const PIECE_H = 60
const BOARD_W = PIECE_W * 3   // 180
const BOARD_Y = 230
const BOARD_START_X = 235 + BOARD_W / 2   // 325
const BOARD_GAP = 30
const BOARD_STEP = BOARD_W + BOARD_GAP     // 210

/** 某幅拼图第 i 块（0~5）的槽位坐标（屏幕坐标，格子中心） */
function slotPos(boardIndex: number, pieceIndex: number) {
  const col = pieceIndex % 3
  const row = Math.floor(pieceIndex / 3)
  const boardX = BOARD_START_X + boardIndex * BOARD_STEP
  return {
    x: boardX + (col - 1) * PIECE_W,
    y: BOARD_Y + (row - 0.5) * PIECE_H,
  }
}

// ================= 第一幅：亚字纹 (3x2 拼图) =================
function yaDrawFns(): ((g: Phaser.GameObjects.Graphics) => void)[] {
  const T = 6 // 线条粗细
  return [
    // ① 左上：外框左上 + 内折线左
    (g) => {
      g.fillStyle(WOOD, 1)
      g.fillRect(-30, -28, 60, T) // 顶横
      g.fillRect(-28, -30, T, 60) // 左竖
      g.fillRect(-28, -8, 30, T)  // 内框左横
    },
    // ② 中上：顶横 + 内折线中上
    (g) => {
      g.fillStyle(WOOD, 1)
      g.fillRect(-30, -28, 60, T) // 顶横
      g.fillRect(8, -28, T, 30)   // 内折线竖
    },
    // ③ 右上：外框右上 + 内折线右
    (g) => {
      g.fillStyle(WOOD, 1)
      g.fillRect(-30, -28, 60, T) // 顶横
      g.fillRect(28, -30, T, 60)  // 右竖
      g.fillRect(8, -8, 30, T)    // 内框右横
    },
    // ④ 左下：外框左下 + 中心竖
    (g) => {
      g.fillStyle(WOOD, 1)
      g.fillRect(-28, -30, T, 60) // 左竖
      g.fillRect(-30, 22, 60, T)  // 底横
      g.fillRect(-3, 0, T, 30)    // 中心竖
    },
    // ⑤ 中下：中心折线
    (g) => {
      g.fillStyle(WOOD, 1)
      g.fillRect(-30, 22, 60, T)  // 底横
      g.fillRect(-3, -30, T, 60)  // 中心竖
      g.fillRect(-30, -8, 30, T)  // 左折线横
      g.fillRect(8, 8, 30, T)     // 右折线横
    },
    // ⑥ 右下：外框右下 + 中心竖
    (g) => {
      g.fillStyle(WOOD, 1)
      g.fillRect(-30, 22, 60, T)  // 底横
      g.fillRect(28, -30, T, 60)  // 右竖
      g.fillRect(-3, -30, T, 30)  // 中心竖
    }
  ]
}

// ================= 第二幅：灯笼纹 (3x2 拼图) =================
// ================= 第二幅：灯笼纹 (3x2 拼图) =================
function lanternDrawFns(): ((g: Phaser.GameObjects.Graphics) => void)[] {
  const T = 6 // 线条粗细
  return [
    // ① 左上：外框左上 + 灯笼左上斜边
    (g) => {
      g.lineStyle(T, RED, 1)
      g.beginPath()
      g.moveTo(-30, -15); g.lineTo(-28, -28); g.lineTo(-15, -30) // 左上角折线
      g.strokePath()
      
      g.beginPath()
      g.moveTo(-15, -15); g.lineTo(-5, -25) // 中心灯笼斜边
      g.strokePath()
    },
    // ② 中上：灯笼顶帽
    (g) => {
      g.fillStyle(RED, 1)
      g.fillRect(-20, -28, 40, T) // 顶盖
      g.fillRect(-12, -22, 24, T) // 底座
    },
    // ③ 右上：外框右上 + 灯笼右上斜边
    (g) => {
      g.lineStyle(T, RED, 1)
      g.beginPath()
      g.moveTo(30, -15); g.lineTo(28, -28); g.lineTo(15, -30) // 右上角折线
      g.strokePath()
      
      g.beginPath()
      g.moveTo(15, -15); g.lineTo(5, -25) // 中心灯笼斜边
      g.strokePath()
    },
    // ④ 左下：外框左下 + 灯笼左下斜边
    (g) => {
      g.lineStyle(T, RED, 1)
      g.beginPath()
      g.moveTo(-30, 15); g.lineTo(-28, 28); g.lineTo(-15, 30) // 左下角折线
      g.strokePath()
      
      g.beginPath()
      g.moveTo(-15, 15); g.lineTo(-5, 25) // 中心灯笼斜边
      g.strokePath()
    },
    // ⑤ 中下：灯笼底帽
    (g) => {
      g.fillStyle(RED, 1)
      g.fillRect(-20, 22, 40, T) // 底座
      g.fillRect(-12, 16, 24, T) // 上座
    },
    // ⑥ 右下：外框右下 + 灯笼右下斜边
    (g) => {
      g.lineStyle(T, RED, 1)
      g.beginPath()
      g.moveTo(30, 15); g.lineTo(28, 28); g.lineTo(15, 30) // 右下角折线
      g.strokePath()
      
      g.beginPath()
      g.moveTo(15, 15); g.lineTo(5, 25) // 中心灯笼斜边
      g.strokePath()
    }
  ]
}

// ================= 第三幅：八角花窗 (保留优化) =================
function changlongDrawFns(): ((g: Phaser.GameObjects.Graphics) => void)[] {
  const T = 5
  return [
    (g) => {
      g.fillStyle(RED, 1)
      g.beginPath(); g.moveTo(-30, -30); g.lineTo(-8, -18); g.lineTo(-18, -8); g.closePath(); g.fillPath()
      g.fillRect(-30, -28, 30, T); g.fillRect(-28, -30, T, 30)
    },
    (g) => {
      g.fillStyle(RED, 1); g.beginPath(); g.arc(0, -22, 12, Math.PI, 0, false); g.fillPath()
      g.fillRect(-6, -22, 12, 24); g.fillRect(-14, -2, 28, 4)
      g.fillStyle(CREAM, 1); g.fillCircle(0, 0, 6)
      g.fillStyle(RED, 1); g.fillCircle(0, 0, 3)
    },
    (g) => {
      g.fillStyle(RED, 1)
      g.beginPath(); g.moveTo(30, -30); g.lineTo(8, -18); g.lineTo(18, -8); g.closePath(); g.fillPath()
      g.fillRect(0, -28, 30, T); g.fillRect(28, -30, T, 30)
    },
    (g) => {
      g.fillStyle(RED, 1)
      g.beginPath(); g.moveTo(-30, 30); g.lineTo(-8, 18); g.lineTo(-18, 8); g.closePath(); g.fillPath()
      g.fillRect(-30, -2, 30, T); g.fillRect(-28, 0, T, 30)
    },
    (g) => {
      g.fillStyle(RED, 1); g.fillRect(-14, -2, 28, 4)
      g.fillStyle(CREAM, 1); g.fillCircle(0, 0, 6)
      g.fillStyle(RED, 1); g.beginPath(); g.arc(0, 22, 12, 0, Math.PI, false); g.fillPath(); g.fillRect(-6, -2, 12, 24)
    },
    (g) => {
      g.fillStyle(RED, 1)
      g.beginPath(); g.moveTo(30, 30); g.lineTo(8, 18); g.lineTo(18, 8); g.closePath(); g.fillPath()
      g.fillRect(0, -2, 30, T); g.fillRect(28, 0, T, 30)
    },
  ]
}

// ================= 第四幅：如意结 (保留优化) =================
function hengtongDrawFns(): ((g: Phaser.GameObjects.Graphics) => void)[] {
  const S = 6
  return [
    (g) => { g.lineStyle(S, WOOD, 1); g.beginPath(); g.arc(60, 30, 45, Math.PI, Math.PI * 1.5, false); g.strokePath() },
    (g) => {
      g.fillStyle(CREAM, 1); g.fillCircle(0, 30, 8); g.lineStyle(2, WOOD, 1); g.strokeCircle(0, 30, 8)
      g.lineStyle(S, WOOD, 1); g.beginPath(); g.arc(-12, -10, 12, Math.PI * 1.1, Math.PI * 1.9, false); g.strokePath()
      g.beginPath(); g.arc(12, -10, 12, Math.PI * 1.1, Math.PI * 1.9, false); g.strokePath()
    },
    (g) => { g.lineStyle(S, WOOD, 1); g.beginPath(); g.arc(-60, 30, 45, Math.PI * 1.5, Math.PI * 2, false); g.strokePath() },
    (g) => { g.lineStyle(S, WOOD, 1); g.beginPath(); g.arc(60, -30, 45, Math.PI * 0.5, Math.PI, false); g.strokePath() },
    (g) => {
      g.fillStyle(CREAM, 1); g.fillCircle(0, -30, 8); g.lineStyle(2, WOOD, 1); g.strokeCircle(0, -30, 8)
      g.lineStyle(S, WOOD, 1); g.beginPath(); g.arc(-12, 10, 12, Math.PI * 0.1, Math.PI * 0.9, false); g.strokePath()
      g.beginPath(); g.arc(12, 10, 12, Math.PI * 0.1, Math.PI * 0.9, false); g.strokePath()
    },
    (g) => { g.lineStyle(S, WOOD, 1); g.beginPath(); g.arc(-60, -30, 45, 0, Math.PI * 0.5, false); g.strokePath() },
  ]
}

// ===== 4 幅拼图板定义 =====
const boards = [
  { prefix: 'ya',        title: '· 亚 字 纹 ·',   drawFns: yaDrawFns() },
  { prefix: 'lantern',   title: '· 灯 笼 纹 ·',   drawFns: lanternDrawFns() },
  { prefix: 'changlomg', title: '· 八 角 花 窗 ·', drawFns: changlongDrawFns() },
  { prefix: 'hengtong',  title: '· 如 意 结 ·',   drawFns: hengtongDrawFns() },
]

// ===== 生成 24 个槽位 + 24 块碎片 =====
export const flowerStreetSlots: PuzzleSlot[] = []
export const flowerStreetPieces: PuzzlePiece[] = []

boards.forEach((board, boardIdx) => {
  board.drawFns.forEach((fn, pieceIdx) => {
    const slotId = `${board.prefix}-s${pieceIdx + 1}`
    const pieceId = `${board.prefix}-p${pieceIdx + 1}`
    const pos = slotPos(boardIdx, pieceIdx)

    flowerStreetSlots.push({
      id: slotId,
      x: pos.x,
      y: pos.y,
      w: PIECE_W,
      h: PIECE_H,
    })

    flowerStreetPieces.push({
      id: pieceId,
      slotId,
       drawFn: (g) => fn(g), // 🌟 这里修复了拼图预览不对的 bug
    })
  })
})

// ===== 碎片初始位置（打乱）=====
const HOME_COLS = 12
const HOME_W = HOME_COLS * PIECE_W + (HOME_COLS - 1) * 4
const HOME_START_X = 640 - HOME_W / 2 + PIECE_W / 2
const HOME_START_Y = 490

function generateShuffledHomePositions(): { x: number; y: number }[] {
  const indices = Array.from({ length: 24 }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  const positions: { x: number; y: number }[] = new Array(24)
  indices.forEach((originalIdx, slotIdx) => {
    const col = slotIdx % HOME_COLS
    const row = Math.floor(slotIdx / HOME_COLS)
    positions[originalIdx] = {
      x: HOME_START_X + col * (PIECE_W + 4),
      y: HOME_START_Y + row * (PIECE_H + 4),
    }
  })
  return positions
}

export const flowerStreetHomePositions = generateShuffledHomePositions()