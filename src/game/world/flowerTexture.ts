import Phaser from 'phaser'

export const FLOWER_TEXTURE_PREFIX = 'flower-'
export const FLOWER_W = 180
export const FLOWER_H = 120
export const PIECE_COLS = 3
export const PIECE_ROWS = 2
export const PIECE_W = FLOWER_W / PIECE_COLS  // 60
export const PIECE_H = FLOWER_H / PIECE_ROWS  // 60

const FLOWERS = [
  { id: 'fu',        char: '福', color: '#a83232', bg: '#e8dcc0' },
  { id: 'shou',      char: '寿', color: '#a83232', bg: '#e8dcc0' },
  { id: 'changlomg', char: '昌', color: '#8a4a2a', bg: '#e8dcc0' },
  { id: 'hengtong',  char: '亨', color: '#8a4a2a', bg: '#e8dcc0' },
]

/**
 * 用 HTML Canvas 生成"完整纹样"的纹理
 * 每次启动只跑一次
 */
export function preloadFlowerTextures(scene: Phaser.Scene) {
  for (const f of FLOWERS) {
    const key = FLOWER_TEXTURE_PREFIX + f.id
    if (scene.textures.exists(key)) continue

    const canvas = document.createElement('canvas')
    canvas.width = FLOWER_W
    canvas.height = FLOWER_H
    const ctx = canvas.getContext('2d')!

    // 底
    ctx.fillStyle = f.bg
    ctx.fillRect(0, 0, FLOWER_W, FLOWER_H)

    // 边框
    ctx.strokeStyle = f.color
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 2
    ctx.strokeRect(4, 4, FLOWER_W - 8, FLOWER_H - 8)
    ctx.globalAlpha = 1

    // 汉字
    ctx.fillStyle = f.color
    ctx.font = 'bold 80px "Noto Serif SC", "Songti SC", SimSun, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(f.char, FLOWER_W / 2, FLOWER_H / 2 + 4)

    // 注册为 Phaser 纹理
    scene.textures.addCanvas(key, canvas)
  }
}

/**
 * 从"完整纹样"里裁出 6 块碎片纹理
 */
export function preloadFlowerPieceTextures(scene: Phaser.Scene) {
  for (const f of FLOWERS) {
    const baseKey = FLOWER_TEXTURE_PREFIX + f.id

    // 重新画一张源 Canvas（和 preloadFlowerTextures 一样）
    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = FLOWER_W
    sourceCanvas.height = FLOWER_H
    const sourceCtx = sourceCanvas.getContext('2d')!
    sourceCtx.fillStyle = f.bg
    sourceCtx.fillRect(0, 0, FLOWER_W, FLOWER_H)
    sourceCtx.strokeStyle = f.color
    sourceCtx.globalAlpha = 0.3
    sourceCtx.lineWidth = 2
    sourceCtx.strokeRect(4, 4, FLOWER_W - 8, FLOWER_H - 8)
    sourceCtx.globalAlpha = 1
    sourceCtx.fillStyle = f.color
    sourceCtx.font = 'bold 80px "Noto Serif SC", "Songti SC", SimSun, serif'
    sourceCtx.textAlign = 'center'
    sourceCtx.textBaseline = 'middle'
    sourceCtx.fillText(f.char, FLOWER_W / 2, FLOWER_H / 2 + 4)

    // 从这个"新 Canvas"切 6 块
    for (let i = 0; i < PIECE_COLS * PIECE_ROWS; i += 1) {
      const col = i % PIECE_COLS
      const row = Math.floor(i / PIECE_COLS)
      const pieceKey = `${baseKey}-p${i + 1}`
      if (scene.textures.exists(pieceKey)) continue

      const canvas = document.createElement('canvas')
      canvas.width = PIECE_W
      canvas.height = PIECE_H
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(
        sourceCanvas,   // ← 用"新画的 canvas"，不是"Phaser 纹理"
        col * PIECE_W,
        row * PIECE_H,
        PIECE_W,
        PIECE_H,
        0,
        0,
        PIECE_W,
        PIECE_H,
      )

      scene.textures.addCanvas(pieceKey, canvas)
    }
  }
}

/** 一次性生成所有纹理（在场景 create 时调用） */
export function preloadAllFlowerTextures(scene: Phaser.Scene) {
  preloadFlowerTextures(scene)
  preloadFlowerPieceTextures(scene)
}