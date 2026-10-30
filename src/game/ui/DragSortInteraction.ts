import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'

const ITEM_W = 90 // 原来是 78，放大到 90
const ITEM_H = 90 // 原来是 78，放大到 90
const SLOT_W = 90 // 槽位也同步放大
const SLOT_H = 90
const GAP = 8 // 间距稍微拉开一点

export type DragSortOptions = {
  scene: Phaser.Scene
  items: { id: string; label: string; hint?: string; image?: string }[]
  slots: { id: string; label: string }[]
  answer: string[]
  baseX: number
  baseY: number
  onAllCorrect: () => void
  onWrong: () => void
}

type SlotPos = { x: number; y: number; index: number }

export class DragSortInteraction {
  private scene: Phaser.Scene
  private items: DragSortOptions['items']
  private slots: DragSortOptions['slots']
  private answer: string[]
  private onAllCorrect: () => void
  private onWrong: () => void
  private slotState: (string | null)[]
  private itemSprites: Map<string, Phaser.GameObjects.Container> = new Map()
  private slotPositions: SlotPos[] = []

  /** 当前被拖拽的对象 */
  private dragging: Phaser.GameObjects.Container | null = null
  /** 拖拽开始时的位置（用于回弹） */
  private dragStartX = 0
  private dragStartY = 0
  /** 是否是"真拖拽"（而不是点击） */
  private isDragging = false
  /** 拖拽激活阈值（移动超过这个像素才算拖拽） */
  private readonly DRAG_THRESHOLD = 6

  constructor(opts: DragSortOptions) {
    this.scene = opts.scene
    this.items = opts.items
    this.slots = opts.slots
    this.answer = opts.answer
    this.onAllCorrect = opts.onAllCorrect
    this.onWrong = opts.onWrong
    this.slotState = new Array(opts.slots.length).fill(null)

    this.layoutSlots(opts.baseX, opts.baseY)
    this.layoutItems(opts.baseX, opts.baseY + 160)

    // ★ 全局监听：pointermove / pointerup
    // 这样即使鼠标移出物品范围，也能继续拖动
    this.scene.input.on('pointermove', this.onPointerMove, this)
    this.scene.input.on('pointerup', this.onPointerUp, this)
  }

  // ===== 槽位 =====
  private layoutSlots(baseX: number, baseY: number) {
    const totalW = this.slots.length * SLOT_W + (this.slots.length - 1) * GAP
    const startX = baseX - totalW / 2 + SLOT_W / 2

    this.slots.forEach((slot, i) => {
      const x = startX + i * (SLOT_W + GAP)
      const y = baseY

      const g = this.scene.add.graphics().setDepth(1000)
      g.lineStyle(2, palette.stoneDeep, 0.5)
      g.strokeRoundedRect(x - SLOT_W / 2, y - SLOT_H / 2, SLOT_W, SLOT_H, 8)

      this.scene.add
        .text(x, y + SLOT_H / 2 - 12, slot.label, {
          fontFamily: UI_FONT,
          fontSize: '10px',
          color: '#9a8d7a',
        })
        .setOrigin(0.5)
        .setDepth(1001)

      this.slotPositions.push({ x, y, index: i })
    })
  }

  // ===== 物品 =====
  // ===== 物品 =====
  private layoutItems(baseX: number, baseY: number) {
    const itemsPerRow = 5; // 每排 5 个
    const rowGap = 10; // 两排之间的垂直间距

    this.items.forEach((item, i) => {
      // 计算当前物品在第几排、第几列
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;

      // 每排单独计算总宽度，使其居中对齐
      const itemsInThisRow = row === 0 ? itemsPerRow : this.items.length - itemsPerRow;
      const totalW = itemsInThisRow * ITEM_W + (itemsInThisRow - 1) * GAP;
      const startX = baseX - totalW / 2 + ITEM_W / 2;

      const x = startX + col * (ITEM_W + GAP);
      // y 坐标根据排数下移
      const y = baseY + row * (ITEM_H + rowGap);

      const sprite = this.createItemSprite(item, x, y)
      this.itemSprites.set(item.id, sprite)
    })
  }

  private createItemSprite(
    item: { id: string; label: string; hint?: string; image?: string },
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const root = this.scene.add.container(x, y)
    root.setDepth(1100)

    // 背景（容器）
    const g = this.scene.add.graphics()
    g.fillStyle(palette.panel, 0.96)
    g.fillRoundedRect(-ITEM_W / 2, -ITEM_H / 2, ITEM_W, ITEM_H, 8)
    g.lineStyle(2, palette.gold, 0.75)
    g.strokeRoundedRect(-ITEM_W / 2, -ITEM_H / 2, ITEM_W, ITEM_H, 8)
    root.add(g)

    // ===== 新增：卡通图片 =====
    // 尝试加载我们 preload 好的贴图（key 就是 item.id）
      // ===== 新增：卡通图片 =====
    if (this.scene.textures.exists(item.id)) {
      const sprite = this.scene.add.image(0, -10, item.id) // 稍微上移
      sprite.setDisplaySize(58, 58) // 图片放大到 58px (原来 46px)
      root.add(sprite)
    }

    // ===== 文字：放到下方 =====
    const t = this.scene.add
      .text(0, 28, item.label, { // 往下移一点
        fontFamily: UI_FONT,
        fontSize: '15px', // 稍微放大一点
        color: '#4a453f',
      })
      .setOrigin(0.5)
    root.add(t)

    // ★ 用一个透明的 Rectangle 当"点击区"（最可靠的交互方式）
    const hitArea = this.scene.add
      .rectangle(0, 0, ITEM_W, ITEM_H, 0x000000, 0.001)
      .setInteractive({ useHandCursor: true })
    root.add(hitArea)

    // 数据
    root.setData('homeX', x)
    root.setData('homeY', y)
    root.setData('itemId', item.id)
    root.setData('locked', false)

    // ★ 只监听 pointerdown，其他交给全局事件
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.onItemPointerDown(root, pointer)
    })

    return root
  }
  // ===== pointerdown：开始"预备拖拽" =====
  private onItemPointerDown(
    root: Phaser.GameObjects.Container,
    pointer: Phaser.Input.Pointer,
  ) {
    if (root.getData('locked')) return
    if (this.dragging) return   // 已经拖着一个了

    this.dragging = root
    this.isDragging = false
    this.dragStartX = pointer.x
    this.dragStartY = pointer.y

    // 记录物品的原始坐标
    root.setData('startX', root.x)
    root.setData('startY', root.y)

    // 先浮到最上层（即使还没真拖）
    root.setDepth(3000)
  }

  // ===== 全局 pointermove =====
  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.dragging) return

    // 判断"是否超过了拖拽阈值"
    if (!this.isDragging) {
      const dx = pointer.x - this.dragStartX
      const dy = pointer.y - this.dragStartY
      if (Math.hypot(dx, dy) < this.DRAG_THRESHOLD) return
      this.isDragging = true
      // 放大一点点表示"真拖起来了"
      this.dragging.setScale(1.08)
    }

    // 跟随鼠标（用世界坐标）
    this.dragging.setPosition(pointer.x, pointer.y)
  }

  // ===== 全局 pointerup =====
  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.dragging) return

    const root = this.dragging
    const wasDragging = this.isDragging

    // 重置状态
    this.dragging = null
    this.isDragging = false
    root.setScale(1)

    if (!wasDragging) {
      // 只是"点了一下"——没拖，回原位
      root.setDepth(1100)
      return
    }

    // 找最近的槽位
    const nearest = this.findNearestSlot(pointer.x, pointer.y)
    if (!nearest) {
      root.setDepth(1100)
      this.returnHome(root)
      return
    }

    const slotIdx = nearest.index
    const itemId = root.getData('itemId') as string

    // 槽位已放正确 → 拒绝
    const occupant = this.slotState[slotIdx]
    if (occupant && this.answer[slotIdx] === occupant) {
      this.showFloatText(root.x, root.y - 40, '该位置已定')
      root.setDepth(1100)
      this.returnHome(root)
      return
    }

    // 判断对错
    if (this.answer[slotIdx] === itemId) {
      // 正确：吸附到槽位中心
      root.setPosition(nearest.x, nearest.y)
      root.setDepth(1200)
      root.setData('locked', true)
      this.slotState[slotIdx] = itemId
      this.checkComplete()
    } else {
      // 错误：提示 + 回弹
      this.showFloatText(root.x, root.y - 40, '尊卑错位，礼制不合')
      root.setDepth(1100)
      this.returnHome(root)
      this.onWrong()
    }
  }

  /** 找离 (x,y) 最近的槽位（吸附阈值 70px） */
  private findNearestSlot(x: number, y: number): SlotPos | null {
    const threshold = 70
    let best: SlotPos | null = null
    let bestDist = Infinity
    for (const s of this.slotPositions) {
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
    const allPlaced = this.slotState.every((s) => s !== null)
    const allCorrect = this.slotState.every((s, i) => s === this.answer[i])
    if (allPlaced && allCorrect) {
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