import { worlds } from '../data/worlds.ts'
import { showCatPostcard } from '../ui/CatPostcardUI.ts'
import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts' // 🌟 引入金币系统
import { paintPyramid } from '../world/paintPyramid.ts'
import { egyptFinalLevel } from '../data/levels/egypt-final.ts'

const LEVEL = egyptFinalLevel

export class EgyptFinalScene extends Phaser.Scene {
  private overlayOpen = false
  private stageText!: Phaser.GameObjects.Text
  private stageLayer!: Phaser.GameObjects.Container
  private stageTexts: Phaser.GameObjects.Text[] = []
  private altarStars: Phaser.GameObjects.Arc[] = []

  private matrixState: boolean[] = new Array(16).fill(false)
  private dialAngle = 0
  private placedSeals: Set<string> = new Set()
  private selectedSealIndex = 0
  private activeSeals: Phaser.GameObjects.Container[] = []
  private bombNodes: Phaser.GameObjects.Text[] = []
  private bombTimerEvent: Phaser.Time.TimerEvent | null = null

  // 🌟 记录失误次数用于完美判定
  private attempts = 0

  constructor() {
    super('EgyptFinalScene')
  }

  create() {
    this.overlayOpen = false
    this.attempts = 0
    this.matrixState.fill(false)
    this.altarStars = []
    this.stageTexts = []
    this.placedSeals.clear()
    this.activeSeals = []
    this.bombNodes = []
    this.bombTimerEvent = null
    this.dialAngle = Phaser.Math.DegToRad(150)

    paintPyramid(this)
    this.drawChamberFloor()
    this.createAltar()

    const uiBg = this.add.graphics().setDepth(900)
    uiBg.fillStyle(palette.paper, 0.6)
    uiBg.fillRoundedRect(160, 140, 960, 500, 20)
    uiBg.lineStyle(2, palette.gold, 0.5)
    uiBg.strokeRoundedRect(160, 140, 960, 500, 20)

    this.stageText = this.add.text(640, 168, '', { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', fontStyle: 'bold' }).setOrigin(0.5).setDepth(901)
    this.stageLayer = this.add.container(0, 0).setDepth(1000)
    this.buildHud()
    this.startStage(1)
  }

  private drawChamberFloor() {
    const g = this.add.graphics().setDepth(10)
    g.fillStyle(0x2a1a10, 0.9)
    g.fillRect(0, 0, 1280, 720)
    g.lineStyle(2, 0x1a0a00, 0.6)
    for(let x = 0; x <= 1280; x += 100) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 720); g.strokePath() }
    for(let y = 0; y <= 720; y += 100) { g.beginPath(); g.moveTo(0, y); g.lineTo(1280, y); g.strokePath() }
  }

  private createAltar() {
    const g = this.add.graphics().setDepth(20)
    g.fillStyle(0x8a7050, 1)
    g.fillRect(540, 40, 200, 60)
    g.lineStyle(3, 0xd4a338, 1)
    g.strokeRect(540, 40, 200, 60)

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 - Math.PI / 2
      const sx = 640 + Math.cos(angle) * 60
      const sy = 70 + Math.sin(angle) * 35
      const star = this.add.circle(sx, sy, 10, 0x3a2210, 1).setDepth(21)
      star.setStrokeStyle(2, 0xd4a338, 0.5)
      this.altarStars.push(star)
    }
  }

  private startStage(stage: number) {
    this.stageLayer.removeAll(true)
    this.stageTexts.forEach(t => t.destroy())
    this.stageTexts = []
    
    if (this.bombTimerEvent) {
      this.bombTimerEvent.remove()
      this.bombTimerEvent = null
    }
    this.input.keyboard!.removeAllListeners('keydown')

    const names = ['', '① 符文矩阵', '② 星象校准', '③ 生死双路', '④ 圣符封印']
    this.stageText.setText(`试炼 ${stage} / 4 · ${names[stage]}`)

    if (stage === 1) this.startMatrix()
    else if (stage === 2) this.startStars()
    else if (stage === 3) this.startDoors()
    else if (stage === 4) this.startSeals()
    else if (stage === 5) this.completeLevel()
  }

  private startMatrix() {
    const tip = this.add.text(640, 210, '剔除 4 个违规伪符，维持同行同列不重复', { fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f' }).setOrigin(0.5).setDepth(1000)
    this.stageTexts.push(tip)

    const startX = 640 - 150
    const startY = 260
    const SIZE = 60
    const GAP = 15

    const baseMatrix = [
      [0, 1, 2, 3], [1, 0, 3, 2], [2, 3, 0, 1], [3, 2, 1, 0]
    ]
    const grid = baseMatrix.map(row => [...row])
    const wrongPositions = [{r:0,c:1}, {r:1,c:3}, {r:2,c:0}, {r:3,c:2}]
    wrongPositions.forEach((pos) => { grid[pos.r][pos.c] = (grid[pos.r][0] + 1) % 4 })
    const types = ['eye', 'ankh', 'sun', 'scarab']

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const x = startX + c * (SIZE + GAP)
        const y = startY + r * (SIZE + GAP)
        const val = grid[r][c]
        const isWrong = wrongPositions.some(p => p.r === r && p.c === c)
        const typeStr = types[val]

        const g = this.add.graphics().setDepth(1000)
        g.fillStyle(0x2a1a10, 1); g.fillRect(x, y, SIZE, SIZE)
        g.lineStyle(2, 0x8a7050, 1); g.strokeRect(x, y, SIZE, SIZE)
        g.lineStyle(2, 0xd4a338, 1)
        const cx = x + SIZE / 2; const cy = y + SIZE / 2
        if (typeStr === 'eye') { g.strokeEllipse(cx, cy, 24, 12); g.fillStyle(0xd4a338, 1); g.fillCircle(cx, cy, 4) } 
        else if (typeStr === 'ankh') { g.strokeCircle(cx, cy - 8, 6); g.fillRect(cx - 2, cy - 2, 4, 14); g.fillRect(cx - 8, cy + 6, 16, 4) } 
        else if (typeStr === 'scarab') { g.fillCircle(cx, cy, 8); g.strokeEllipse(cx, cy, 16, 22) } 
        else if (typeStr === 'sun') { g.strokeCircle(cx, cy, 10); g.fillCircle(cx, cy, 4) }

        const hit = this.add.rectangle(cx, cy, SIZE, SIZE, 0x000000, 0.001).setInteractive({ useHandCursor: true }).setDepth(1001)
        hit.on('pointerdown', () => {
          if (this.overlayOpen) return
          if (isWrong) {
            hit.destroy(); g.clear()
            g.fillStyle(0x1a0a00, 0.5); g.fillRect(x, y, SIZE, SIZE)
            this.matrixState[r * 4 + c] = true
            if (this.matrixState.filter(v => v).length === 4) {
              this.showToast('神圣矩阵已净化！')
              this.time.delayedCall(800, () => this.startStage(2))
            }
          } else {
            this.showToast('这是神圣符文，不可剔除！')
            this.attempts++ // 🌟 点错记录失误
            this.cameras.main.shake(100, 0.01)
          }
        })
        this.stageLayer.add([g, hit])
      }
    }
  }

  private startStars() {
    const tip = this.add.text(640, 520, '调整星盘，使指针对准上方的北极星', { fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f' }).setOrigin(0.5).setDepth(1000)
    this.stageTexts.push(tip)
    const cx = 640; const cy = 360

    const dialG = this.add.graphics().setDepth(1000)
    dialG.fillStyle(0x3a2a1a, 0.6); dialG.fillCircle(cx, cy, 100)
    dialG.lineStyle(4, 0x8a7050, 1); dialG.strokeCircle(cx, cy, 100)

    const starGlow = this.add.circle(cx, cy - 80, 16, 0xffffff, 0.3).setDepth(999)
    this.tweens.add({ targets: starGlow, scale: 1.5, alpha: 0.1, duration: 1000, yoyo: true, repeat: -1 })
    this.add.circle(cx, cy - 80, 8, 0xffffff, 1).setDepth(1001)
    
    const starText = this.add.text(cx, cy - 115, '北极星', { fontFamily: UI_FONT, fontSize: '12px', color: '#d4a338' }).setOrigin(0.5).setDepth(1001)
    this.stageTexts.push(starText)

    const rotContainer = this.add.container(cx, cy).setDepth(1001)
    const pointer = this.add.graphics()
    pointer.fillStyle(0xd4a338, 1)
    pointer.beginPath(); pointer.moveTo(0, -75); pointer.lineTo(-8, 0); pointer.lineTo(8, 0); pointer.closePath(); pointer.fillPath()
    pointer.fillStyle(0x8a7050, 1)
    pointer.beginPath(); pointer.moveTo(0, 20); pointer.lineTo(-8, 0); pointer.lineTo(8, 0); pointer.closePath(); pointer.fillPath()
    rotContainer.add(pointer)
    rotContainer.rotation = this.dialAngle

    const btnL = this.add.text(cx - 140, cy, '◀', { fontSize: '48px', color: '#d4a338' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1002)
    const btnR = this.add.text(cx + 140, cy, '▶', { fontSize: '48px', color: '#d4a338' }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1002)

    const rotate = (dir: number) => {
      this.dialAngle = Phaser.Math.Angle.Wrap(this.dialAngle + dir * Phaser.Math.DegToRad(15))
      rotContainer.rotation = this.dialAngle
      if (Math.abs(this.dialAngle) < 0.1) {
        this.showToast('星象已校准！')
        btnL.destroy(); btnR.destroy(); starGlow.destroy()
        this.time.delayedCall(800, () => this.startStage(3))
      }
    }
    btnL.on('pointerdown', () => rotate(-1))
    btnR.on('pointerdown', () => rotate(1))

    this.stageLayer.add([dialG, rotContainer, btnL, btnR])
  }

  private startDoors() {
    const tips = [
      '箴言一：圣甲虫向阳而生，真路入口光影偏东。',
      '箴言二：荷鲁斯守护生者，真路无暗影杂音。',
      '箴言三：亡灵通道纹理错乱、符文倒置。'
    ]
    tips.forEach((text, i) => {
      const t = this.add.text(640, 210 + i * 24, text, { fontFamily: UI_FONT, fontSize: '14px', color: '#4a453f' }).setOrigin(0.5).setDepth(1000)
      this.stageTexts.push(t)
    })

    const startY = 380
    const leftX = 480
    const rightX = 800

    const leftG = this.add.graphics().setDepth(1000)
    leftG.fillStyle(0x3a2210, 1); leftG.fillRect(leftX - 80, startY - 120, 160, 240)
    leftG.fillStyle(0xe8dcc0, 0.2); leftG.fillTriangle(leftX + 80, startY - 120, leftX - 80, startY - 120, leftX - 80, startY + 120)
    leftG.lineStyle(3, 0xd4a338, 1); leftG.strokeEllipse(leftX, startY, 30, 16); leftG.fillStyle(0xd4a338,1); leftG.fillCircle(leftX, startY, 5)

    const rightG = this.add.graphics().setDepth(1000)
    rightG.fillStyle(0x3a2210, 1); rightG.fillRect(rightX - 80, startY - 120, 160, 240)
    rightG.fillStyle(0x000000, 0.4); rightG.fillRect(rightX - 80, startY + 40, 160, 80)
    rightG.lineStyle(3, 0x8a7050, 0.5); rightG.strokeEllipse(rightX, startY + 20, 30, 16); rightG.fillStyle(0x8a7050,0.5); rightG.fillCircle(rightX, startY + 20, 5)
    rightG.lineStyle(2, 0x8a7050, 0.5); rightG.strokeRect(rightX - 20, startY - 20, 40, 30) 

    const hitL = this.add.rectangle(leftX, startY, 160, 240, 0x000000, 0.001).setInteractive({ useHandCursor: true }).setDepth(1001)
    const hitR = this.add.rectangle(rightX, startY, 160, 240, 0x000000, 0.001).setInteractive({ useHandCursor: true }).setDepth(1001)

    hitL.on('pointerdown', () => {
      this.showToast('选择正确！生者之路已开启。')
      this.time.delayedCall(1000, () => this.startStage(4))
    })

    hitR.on('pointerdown', () => {
      this.showToast('触发沙尘机关！退回寻宝最开始。')
      this.attempts++ // 🌟 走错门记录失误
      this.cameras.main.shake(400, 0.02)
      this.cameras.main.flash(500, 200, 150, 50)
      this.time.delayedCall(1500, () => this.scene.restart())
    })

    this.stageLayer.add([leftG, rightG, hitL, hitR])
  }

  private startSeals() {
    const tip = this.add.text(640, 210, '按 1~4 切换符号，方向键移动，避开炸弹', { fontFamily: UI_FONT, fontSize: '15px', color: '#4a453f' }).setOrigin(0.5).setDepth(1000)
    this.stageTexts.push(tip)

    this.activeSeals = []
    this.bombNodes = []
    this.placedSeals.clear()
    this.selectedSealIndex = 0

    const icons = [
      { id: 'scarab', icon: '🪲', x: 300, y: 540 },
      { id: 'eye', icon: '👁', x: 500, y: 540 },
      { id: 'ankh', icon: '☥', x: 700, y: 540 },
      { id: 'staff', icon: '🦯', x: 900, y: 540 },
    ]

    type Slot = { id: string; x: number; y: number }
    const slots: Slot[] = [
      { id: 'scarab', x: 580, y: 320 },
      { id: 'eye', x: 700, y: 320 },
      { id: 'ankh', x: 700, y: 440 },
      { id: 'staff', x: 580, y: 440 },
    ]

    const slotHints: Record<string, string> = { 'scarab': '🪲', 'eye': '👁', 'ankh': '☥', 'staff': '🦯' }

    slots.forEach(slot => {
      const g = this.add.graphics().setDepth(1000)
      g.lineStyle(2, 0xd4a338, 0.5); g.strokeCircle(slot.x, slot.y, 30)
      this.stageLayer.add(g)
      const hint = this.add.text(slot.x, slot.y, slotHints[slot.id], { fontSize: '36px' }).setOrigin(0.5).setDepth(1000).setAlpha(0.2)
      this.stageLayer.add(hint)
    })

    icons.forEach((item, index) => {
      const container = this.add.container(item.x, item.y).setDepth(1001)
      const txt = this.add.text(0, 0, item.icon, { fontSize: '36px' }).setOrigin(0.5)
      container.add(txt)
      const highlighter = this.add.circle(0, 0, 30, 0xd4a338, 0.2)
      container.add(highlighter)
      highlighter.setVisible(index === 0)

      container.setData('id', item.id)
      container.setData('homeX', item.x)
      container.setData('homeY', item.y)
      container.setData('highlighter', highlighter)
      
      this.activeSeals.push(container)
      this.stageLayer.add(container)
    })

    for (let i = 0; i < 2; i++) {
      const bomb = this.add.text(640, 360, '💣', { fontSize: '40px' }).setOrigin(0.5).setDepth(1002)
      this.bombNodes.push(bomb)
    }

    this.bombTimerEvent = this.time.addEvent({
      delay: 800, loop: true,
      callback: () => {
        if (this.overlayOpen) return
        this.bombNodes.forEach(bomb => {
          const angle = Phaser.Math.Between(0, 3) * Math.PI / 2
          const dist = 50
          const newX = Phaser.Math.Clamp(bomb.x + Math.cos(angle) * dist, 200, 1080)
          const newY = Phaser.Math.Clamp(bomb.y + Math.sin(angle) * dist, 250, 550)
          this.tweens.add({ targets: bomb, x: newX, y: newY, duration: 600 })
        })
      }
    })

    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (this.overlayOpen) return
      const active = this.activeSeals[this.selectedSealIndex]
      if (!active || !active.active) return
      
      const step = 30
      if (e.code === 'ArrowUp' || e.code === 'KeyW') active.y -= step
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') active.y += step
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') active.x -= step
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') active.x += step
      else if (e.code === 'Digit1') this.switchSeal(0)
      else if (e.code === 'Digit2') this.switchSeal(1)
      else if (e.code === 'Digit3') this.switchSeal(2)
      else if (e.code === 'Digit4') this.switchSeal(3)

      active.x = Phaser.Math.Clamp(active.x, 160, 1120)
      active.y = Phaser.Math.Clamp(active.y, 240, 600)

      this.bombNodes.forEach(b => {
        const d = Phaser.Math.Distance.Between(active.x, active.y, b.x, b.y)
        if (d < 35) {
          this.showToast('被炸弹击中！退回原位')
          active.x = active.getData('homeX')
          active.y = active.getData('homeY')
          this.attempts++ // 🌟 被炸记录失误
          this.cameras.main.shake(150, 0.01)
        }
      })

      slots.forEach(slot => {
        const d = Phaser.Math.Distance.Between(active.x, active.y, slot.x, slot.y)
        if (d < 40 && slot.id === active.getData('id')) {
          active.x = slot.x; active.y = slot.y
          const hi = active.getData('highlighter') as Phaser.GameObjects.Arc
          hi.setVisible(false)
          
          this.placedSeals.add(slot.id)
          this.showToast(`「${slot.id}」已归位`)
          
          active.setActive(false).setVisible(false)
          this.switchNextUnplaced()

          if (this.placedSeals.size === 4) {
            this.showToast('圣符闭环完成！祭坛震动！')
            this.time.delayedCall(1000, () => this.startStage(5))
          }
        }
      })
    })
  }

  private switchSeal(index: number) {
    if (index >= 0 && index < this.activeSeals.length) {
      const curr = this.activeSeals[this.selectedSealIndex]
      if (curr && curr.active) (curr.getData('highlighter') as Phaser.GameObjects.Arc).setVisible(false)
      this.selectedSealIndex = index
      const next = this.activeSeals[index]
      if (next && next.active) (next.getData('highlighter') as Phaser.GameObjects.Arc).setVisible(true)
    }
  }

  private switchNextUnplaced() {
    for (let i = 0; i < this.activeSeals.length; i++) {
      if (this.activeSeals[i].active) { this.switchSeal(i); return }
    }
  }

  private completeLevel() {
    this.altarStars.forEach(star => star.setFillStyle(0xd4a338, 1))
    const glow = this.add.rectangle(640, 360, 200, 400, 0xd4a338, 0.3).setDepth(2000)
    this.tweens.add({ targets: glow, alpha: 0.8, scaleX: 1.5, duration: 1000, yoyo: true, repeat: -1 })
    this.showToast('法老星辰秘藏开启！')
    this.time.delayedCall(2000, () => this.showKnowledgeCard())
  }

  private buildHud() {
    const hud = roundedPanel(this, 28, 24, 360, 92).setDepth(3000)
    hud.setScrollFactor(0)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(3001)
    this.add.text(48, 70, LEVEL.objective, { fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354' }).setDepth(3001)
    textButton(this, 1150, 100, '重 来', () => this.scene.restart()).setDepth(3001)
  }

  private showKnowledgeCard() {
    if (this.overlayOpen) return
    this.overlayOpen = true
    showKnowledgeCard(this, LEVEL.knowledgeCard, () => this.showAzhuComment())
  }

  private showAzhuComment() {
    const box = this.add.container(640, 600).setDepth(5000).setAlpha(0)
    const panel = roundedPanel(this, -420, -44, 840, 88, palette.panel)
    const icon = this.add.text(-380, -12, '🌸', { fontSize: '24px' })
    const label = this.add.text(-340, -32, '阿筑', { fontFamily: UI_FONT, fontSize: '14px', color: '#b09a6e' })
    const body = this.add.text(-340, -10, LEVEL.azhuComment, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', wordWrap: { width: 740 } })
    box.add([panel, icon, label, body])

    this.tweens.add({
      targets: box, alpha: 1, y: 588, duration: 320,
      onComplete: () => {
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: box, alpha: 0, y: 620, duration: 320,
            onComplete: () => { box.destroy(); this.showSuccess() },
          })
        })
      },
    })
  }

  private showSuccess() {
    // 🌟 标记通关 + 发钱（没失误为完美通关）
    LevelProgress.markCompleted('egypt-final')
    const isPerfect = this.attempts === 0
    const reward = CoinSystem.rewardLevel('egypt-final', isPerfect)
    CoinSystem.showFloatText(this, reward)

    // 判断是否全通关弹明信片
    const currentWorld = worlds.find(w => w.id === 'egypt-pyramid')
    if (currentWorld?.levels?.every(lv => LevelProgress.isCompleted(lv.id))) {
      showCatPostcard(this, 'egypt-pyramid')
    }

    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.38).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, '星辰秘藏', { fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, '你解开了法老的封印，星辰的秘密重见天日。', { fontFamily: UI_FONT, fontSize: '18px', color: '#6a635b', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5, 0).setDepth(5002)

    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'egypt-pyramid' })
    }).setDepth(5002)
  }

  private showToast(msg: string) {
    const t = this.add.text(640, 120, msg, { fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f', backgroundColor: '#efe6d8ee', padding: { x: 14, y: 8 } }).setOrigin(0.5).setDepth(4000).setAlpha(0)
    this.tweens.add({ targets: t, alpha: 1, y: 108, duration: 220, yoyo: true, hold: 1400, onComplete: () => t.destroy() })
  }
}