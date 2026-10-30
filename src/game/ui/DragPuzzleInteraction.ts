import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'

/** 拼图碎片 */
export type PuzzlePiece = {
  id: string
  slotId: string
  /** 在 60×60 的格子里，以中心为 (0, 0) 画这块碎片的内容 */
  drawFn: (g: Phaser.GameObjects.Graphics, w: number, h: number) => void
}

/** 槽位（拼图板的格子） */
export type PuzzleSlot = {
  id: string
  x: number           // 屏幕坐标（格子中心）
  y: number
  w: number
  h: number
}

export type DragPuzzleOptions = {
  scene: Phaser.Scene
  pieces: PuzzlePiece[]
  slots: PuzzleSlot[]
  /** 碎片初始位置（打乱后的） */
  pieceHomePositions: { x: number; y: number }[]
  onAllCorrect: () => void
  onWrong: () => void
}

type SlotPos = {
  id: string
  x: number
  y: number
  w: number
    h: number
  filled: boolean
}

export class DragPuzzleInteraction {
  private scene: Phaser.Scene
  private slots: SlotPos[] = []
  private onAllCorrect: () => void
  private onWrong: () => void

  private pieceSprites: Map<string, Phaser.GameObjects.Container> = new Map()
  private dragging: Phaser.GameObjects.Container | null = null
  private dragStartX = 0
  private dragStartY = 0
  private isDragging = false
  private readonly DRAG_THRESHOLD = 6

  private readonly PIECE_W = 60
  private readonly PIECE_H = 60

  constructor(opts: DragPuzzleOptions) {
    this.scene = opts.scene
    this.onAllCorrect = opts.onAllCorrect
    this.onWrong = opts.onWrong

    // 复制槽位（加 filled 状态）
    this.slots = opts.slots.map((s) => ({
      id: s.id,
      x: s.x,
      y: s.y,
      w: s.w,
      h: s.h,
      filled: false,
    }))

    // 画槽位底板
    this.paintSlotFrames()

    // 画碎片
    opts.pieces.forEach((piece, i) => {
      const home = opts.pieceHomePositions[i]
      const sprite = this.createPieceSprite(piece, home.x, home.y)
      this.pieceSprites.set(piece.id, sprite)
    })

    // 全局监听
    this.scene.input.on('pointermove', this.onPointerMove, this)
    this.scene.input.on('pointerup', this.onPointerUp, this)
  }

  // ===== 槽位底板 =====
  private paintSlotFrames() {
    const g = this.scene.add.graphics().setDepth(1000)
    for (const slot of this.slots) {
      g.lineStyle(1.5, palette.stoneDeep, 0.5)
      g.strokeRect(slot.x - slot.w / 2, slot.y - slot.h / 2, slot.w, slot.h)
    }
  }

  // ===== 碎片精灵 =====
  private createPieceSprite(
    piece: PuzzlePiece,
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const root = this.scene.add.container(x, y)
    root.setDepth(1100)

        // 底色（米色统一底）
    const g = this.scene.add.graphics()
    g.fillStyle(0xe8dcc0, 1)
    g.fillRect(-this.PIECE_W / 2, -this.PIECE_H / 2, this.PIECE_W, this.PIECE_H)
    g.lineStyle(1.5, 0x8a4a2a, 0.4)
    g.strokeRect(-this.PIECE_W / 2, -this.PIECE_H / 2, this.PIECE_W, this.PIECE_H)

    // ★ 调用碎片自己的绘制函数
    piece.drawFn(g, this.PIECE_W, this.PIECE_H)
    root.add(g)

    // 透明点击区
    const hitArea = this.scene.add
      .rectangle(0, 0, this.PIECE_W, this.PIECE_H, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true })
    root.add(hitArea)

    // 数据
    root.setData('homeX', x)
    root.setData('homeY', y)
    root.setData('pieceId', piece.id)
    root.setData('slotId', piece.slotId)
    root.setData('locked', false)

    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.onPiecePointerDown(root, pointer)
    })

    return root
  }

  // ===== 拖拽逻辑 =====
  private onPiecePointerDown(
    root: Phaser.GameObjects.Container,
    pointer: Phaser.Input.Pointer,
  ) {
    if (root.getData('locked')) return
    if (this.dragging) return

    this.dragging = root
    this.isDragging = false
    this.dragStartX = pointer.x
    this.dragStartY = pointer.y

    root.setData('startX', root.x)
    root.setData('startY', root.y)
    root.setDepth(3000)
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.dragging) return

    if (!this.isDragging) {
      const dx = pointer.x - this.dragStartX
      const dy = pointer.y - this.dragStartY
      if (Math.hypot(dx, dy) < this.DRAG_THRESHOLD) return
      this.isDragging = true
      this.dragging.setScale(1.1)
    }

    this.dragging.setPosition(pointer.x, pointer.y)
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.dragging) return

    const root = this.dragging
    const wasDragging = this.isDragging

    this.dragging = null
    this.isDragging = false
    root.setScale(1)

    if (!wasDragging) {
      root.setDepth(1100)
      return
    }

    // 找最近槽位
    const nearest = this.findNearestSlot(pointer.x, pointer.y)
    if (!nearest) {
      root.setDepth(1100)
      this.returnHome(root)
      return
    }

    const pieceSlotId = root.getData('slotId') as string

    // 槽位已占 → 拒绝
    if (nearest.filled) {
      this.showFloatText(root.x, root.y - 40, '此处已有碎片')
      root.setDepth(1100)
      this.returnHome(root)
      return
    }

    // 判断对错
    if (nearest.id === pieceSlotId) {
      // 正确
      root.setPosition(nearest.x, nearest.y)
      root.setDepth(1200)
      root.setData('locked', true)
      nearest.filled = true
      this.checkComplete()
    } else {
      // 错误
      this.showFloatText(root.x, root.y - 40, '纹样不符')
      root.setDepth(1100)
      this.returnHome(root)
      this.onWrong()
    }
  }

  private findNearestSlot(x: number, y: number): SlotPos | null {
    const threshold = Math.max(this.PIECE_W, this.PIECE_H) * 1.2
    let best: SlotPos | null = null
    let bestDist = Infinity
    for (const s of this.slots) {
      const d = Math.hypot(s.x - x, s.y - y)
      if (d < threshold && d < bestDist) {
        bestDist = d
        best = s
      }
    }
    return best
  }

  private returnHome(sprite: Phaser.GameObjects.Container) {
    this.scene.tweens.add({
      targets: sprite,
      x: sprite.getData('homeX'),
      y: sprite.getData('homeY'),
      duration: 260,
      ease: 'Back.easeOut',
    })
  }

  private checkComplete() {
    const allFilled = this.slots.every((s) => s.filled)
    if (allFilled) {
      this.scene.time.delayedCall(400, () => this.onAllCorrect())
    }
  }

  private showFloatText(x: number, y: number, msg: string) {
    const t = this.scene.add
      .text(x, y, msg, {
        fontFamily: UI_FONT,
        fontSize: '14px',
        color: '#8a3424',
        backgroundColor: '#f3e8cfee',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(4000)
      .setAlpha(0)

    this.scene.tweens.add({
      targets: t,
      alpha: 1,
      y: y - 20,
      duration: 240,
      yoyo: true,
      hold: 900,
      onComplete: () => t.destroy(),
    })
  }
}