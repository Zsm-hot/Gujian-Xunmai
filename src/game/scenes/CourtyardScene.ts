import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts'
import { AudioSystem } from '../systems/AudioSystem.ts'

const LEVEL = {
  id: 'forbidden-city-hall',
  chapter: '寻脉其一 · 其一',
  title: '故宫拾遗',
  knowledgeCard: {
    title: '紫禁城的礼制与秩序',
    content: '故宫的布局讲究“中轴对称”，前朝后寝，左祖右社。屋脊兽的数量和排列代表了建筑的等级。',
    source: '参考资料：《紫禁城建筑》',
  },
  azhuComment: '礼制不是冷冰冰的规矩，而是古人用空间表达的责任与分寸。',
  successTitle: '勘察完毕',
  successBody: '你解开了紫禁城的空间密码，收集了所有线索。',
}

const MAZE_SIZE = 11
const TILE_SIZE = 50
const MAZE_START_X = 640 - (MAZE_SIZE * TILE_SIZE) / 2
const MAZE_START_Y = 360 - (MAZE_SIZE * TILE_SIZE) / 2

// 🌟 核心修复：重塑 11x11 矩阵，1为石板路(连通)，0为红墙(阻挡)
const MAZE_MAP = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0], // 角楼在 (5,1)
  [0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0],
  [0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0], // 太和殿在 (1,3)
  [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0], // 军机处在 (9,6)
  [0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // 御花园在 (3,9)
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
]

interface Landmark {
  id: string
  name: string
  c: number
  r: number
  question: {
    q: string
    options: string[]
    answer: number
  }
  unlocked: boolean
}

// 坐标完全落在 1（路）上
const LANDMARKS: Landmark[] = [
  { id: 'square', name: '太和殿广场', c: 1, r: 3, unlocked: false, question: { q: '观察题：屋脊兽位于屋脊的哪里？', options: ['正脊与垂脊上', '屋檐下方', '门楣中央'], answer: 0 } },
  { id: 'corner', name: '角楼', c: 5, r: 1, unlocked: false, question: { q: '判断：关于屋脊兽数量，哪个说法正确？', options: ['数量越多，建筑等级越高', '数量越少，建筑等级越高', '只有皇帝才能用10个'], answer: 0 } },
  { id: 'junjichu', name: '军机处', c: 9, r: 6, unlocked: false, question: { q: '谜语：哪种兽象征“忠心护主”？', options: ['狮子', '海马', '押鱼'], answer: 0 } },
  { id: 'garden', name: '御花园', c: 3, r: 9, unlocked: false, question: { q: '记忆题：下列哪组脊兽是正确顺序？', options: ['龙、凤、狮子', '狮子、龙、凤', '凤、狮子、龙'], answer: 0 } }, 
]

export class CourtyardScene extends Phaser.Scene {
  private overlayOpen = false
  private completed = false
  private playerPos = { c: 1, r: 1 } // 出生点在左上角第一个路块
  private playerSprite!: Phaser.GameObjects.Arc
  private isDragging = false
  private unlockedCount = 0
  private isAnswering = false
  private questionUI: Phaser.GameObjects.Container | null = null

  constructor() {
    super('CourtyardScene')
  }

  create() {
    this.overlayOpen = false
    this.completed = false
    this.unlockedCount = 0
    this.isAnswering = false
    this.questionUI = null
    LANDMARKS.forEach(l => l.unlocked = false)

    this.add.rectangle(640, 360, 1280, 720, 0x1a1614) // 深色背景

    this.drawMaze()

    this.playerSprite = this.add.circle(
      MAZE_START_X + this.playerPos.c * TILE_SIZE + TILE_SIZE / 2,
      MAZE_START_Y + this.playerPos.r * TILE_SIZE + TILE_SIZE / 2,
      12, 0xd4a338
    ).setDepth(100)
    this.playerSprite.setStrokeStyle(2, 0xffffff, 1)

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true
      this.movePlayerToPointer(pointer)
    })
    this.input.on('pointerup', () => { this.isDragging = false })
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && !this.overlayOpen) {
        this.movePlayerToPointer(pointer)
      }
    })

    this.buildHud()
  }

  private drawMaze() {
    const g = this.add.graphics().setDepth(10)
    
    for (let r = 0; r < MAZE_SIZE; r++) {
      for (let c = 0; c < MAZE_SIZE; c++) {
        const x = MAZE_START_X + c * TILE_SIZE
        const y = MAZE_START_Y + r * TILE_SIZE
        const type = MAZE_MAP[r][c]

        if (type === 0) {
          // 🌟 红墙质感
          g.fillStyle(0x8c2b2b, 1)
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE)
          g.lineStyle(2, 0x5a1a1a, 1) // 暗红勾边
          g.strokeRect(x, y, TILE_SIZE, TILE_SIZE)
          // 墙顶金边
          g.lineStyle(1, 0xd4a338, 0.4)
          g.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4)
        } else {
          // 🌟 石板路质感
          g.fillStyle(0xe8dcc8, 1)
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE)
          g.lineStyle(1, 0xb09a6e, 0.3)
          g.strokeRect(x, y, TILE_SIZE, TILE_SIZE)
        }
      }
    }

    LANDMARKS.forEach(l => {
      const x = MAZE_START_X + l.c * TILE_SIZE + TILE_SIZE / 2
      const y = MAZE_START_Y + l.r * TILE_SIZE + TILE_SIZE / 2
      
      const circle = this.add.circle(x, y, 18, 0x2d1c10, 0.9).setDepth(20)
      circle.setStrokeStyle(2, 0xd4a338, 1)
      
      this.add.text(x, y, l.id === 'square' ? '🏛️' : l.id === 'corner' ? '🏯' : l.id === 'junjichu' ? '📜' : '🌸', { 
        fontSize: '20px' 
      }).setOrigin(0.5).setDepth(21)
      
      this.add.text(x, y + 28, l.name, {
        fontFamily: UI_FONT, fontSize: '11px', color: '#ffffff', backgroundColor: '#4a3020cc', padding: {x:4, y:2}
      }).setOrigin(0.5).setDepth(21)
    })
  }

  private movePlayerToPointer(pointer: Phaser.Input.Pointer) {
    if (this.overlayOpen || this.completed) return

    const c = Math.floor((pointer.x - MAZE_START_X) / TILE_SIZE)
    const r = Math.floor((pointer.y - MAZE_START_Y) / TILE_SIZE)

    if (r < 0 || r >= MAZE_SIZE || c < 0 || c >= MAZE_SIZE) return
    if (MAZE_MAP[r][c] === 0) return

    const dc = c - this.playerPos.c
    const dr = r - this.playerPos.r
    
    // 直线滑动
    if (Math.abs(dc) > 0 && Math.abs(dr) === 0) {
      const step = dc > 0 ? 1 : -1
      for (let i = 1; i <= Math.abs(dc); i++) {
        if (MAZE_MAP[this.playerPos.r][this.playerPos.c + i * step] === 0) return
      }
      this.playerPos = { c, r }
    } else if (Math.abs(dr) > 0 && Math.abs(dc) === 0) {
      const step = dr > 0 ? 1 : -1
      for (let i = 1; i <= Math.abs(dr); i++) {
        if (MAZE_MAP[this.playerPos.r + i * step][this.playerPos.c] === 0) return
      }
      this.playerPos = { c, r }
    } else {
      if (Math.abs(dc) + Math.abs(dr) === 1) {
        this.playerPos = { c, r }
      } else {
        return
      }
    }

    this.tweens.add({
      targets: this.playerSprite,
      x: MAZE_START_X + this.playerPos.c * TILE_SIZE + TILE_SIZE / 2,
      y: MAZE_START_Y + this.playerPos.r * TILE_SIZE + TILE_SIZE / 2,
      duration: 80
    })

    this.checkLandmarkCollision()
  }

  private checkLandmarkCollision() {
    if (this.overlayOpen) return;

    const lm = LANDMARKS.find(l => l.c === this.playerPos.c && l.r === this.playerPos.r)
    
    if (lm && !lm.unlocked) {
      lm.unlocked = true 
      this.showQuestionPanel(lm)
    }
  }

  private showQuestionPanel(lm: Landmark) {
    this.overlayOpen = true
    this.isAnswering = false 
    AudioSystem.playSFX('click')

    this.questionUI = this.add.container(0, 0).setDepth(5000)

    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.75)
    this.questionUI.add(overlay)

    const uiContainer = this.add.container(640, 360)
    const panelBg = this.add.graphics()
    panelBg.fillStyle(palette.paper, 1)
    panelBg.fillRoundedRect(-320, -200, 640, 400, 16)
    panelBg.lineStyle(3, 0xd4a338, 0.8)
    panelBg.strokeRoundedRect(-320, -200, 640, 400, 16)
    uiContainer.add(panelBg)

    uiContainer.add(this.add.text(0, -150, `【${lm.name}】`, {
      fontFamily: UI_FONT, fontSize: '24px', color: '#8c3b2b', fontStyle: 'bold'
    }).setOrigin(0.5))

    uiContainer.add(this.add.text(0, -90, lm.question.q, {
      fontFamily: UI_FONT, fontSize: '20px', color: '#4a453f', 
      wordWrap: { width: 520 }, align: 'center'
    }).setOrigin(0.5))

    const feedbackText = this.add.text(0, 160, '', {
      fontFamily: UI_FONT, fontSize: '18px', fontStyle: 'bold'
    }).setOrigin(0.5)
    uiContainer.add(feedbackText)

    lm.question.options.forEach((opt, idx) => {
      const btn = textButton(this, 0, -20 + idx * 60, opt, () => {
        if (this.isAnswering) return
        this.isAnswering = true

        if (idx === lm.question.answer) {
          AudioSystem.playSFX('success')
          feedbackText.setText('✔ 回答正确！')
          feedbackText.setColor('#d4a338')
          
          if (this.questionUI) {
            this.questionUI.destroy(true)
            this.questionUI = null
          }
          this.overlayOpen = false
          
          const x = MAZE_START_X + lm.c * TILE_SIZE + TILE_SIZE / 2
          const y = MAZE_START_Y + lm.r * TILE_SIZE + TILE_SIZE / 2
          const goldCircle = this.add.circle(x, y, 18, 0xd4a338, 0.9).setDepth(22)
          goldCircle.setStrokeStyle(2, 0xffffff, 1)

          this.unlockedCount++
          if (this.unlockedCount >= LANDMARKS.length) {
            this.completeLevel()
          }
        } else {
          AudioSystem.playSFX('error')
          this.cameras.main.shake(200, 0.01)
          feedbackText.setText('✘ 回答错误，请再想想！')
          feedbackText.setColor('#d04848')
          
          this.time.delayedCall(500, () => {
            this.isAnswering = false
          })
        }
      })
      uiContainer.add(btn)
    })

    this.questionUI.add(uiContainer)
  }

  private buildHud() {
    roundedPanel(this, 28, 24, 360, 92).setDepth(2000)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    this.add.text(48, 70, '按住鼠标沿着石板路滑动，前往四个地标答题', { fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354' }).setDepth(2001)

    textButton(this, 1150, 100, '重 来', () => { this.scene.restart() }).setDepth(2001)
  }

  private completeLevel() {
    if (this.completed) return
    this.completed = true
    this.cameras.main.flash(1500, 255, 255, 255)
    
    this.time.delayedCall(1000, () => {
      LevelProgress.markCompleted(LEVEL.id)
      const reward = CoinSystem.rewardLevel(LEVEL.id, true)
      CoinSystem.showFloatText(this, reward)
      
      showKnowledgeCard(this, LEVEL.knowledgeCard, () => {
        this.showSuccessPanel()
      })
    })
  }

  private showSuccessPanel() {
    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.5).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    
    this.add.text(640, 230, LEVEL.successTitle, { fontFamily: UI_FONT, fontSize: '32px', color: '#d4a338' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, LEVEL.successBody, { fontFamily: UI_FONT, fontSize: '18px', color: '#e8dcc8', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5, 0).setDepth(5002)
    
    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'forbidden-city' })
    }).setDepth(5002)
  }
}