import Phaser from 'phaser'
import { UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts' // 🌟 引入金币系统
import { paintDome } from '../world/domeDrawers.ts'
import { domeLightLevel } from '../data/levels/dome-wall.ts'

const LEVEL = domeLightLevel

const GRID_SIZE = 7
const TILE_SIZE = 60
const START_X = 640 - (GRID_SIZE * TILE_SIZE) / 2
const START_Y = 360 - (GRID_SIZE * TILE_SIZE) / 2

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type LightColor = 'white' | 'blue' | 'gold'

const TARGETS = [
  { c: 6, r: 1, color: 'blue' as LightColor },
  { c: 6, r: 5, color: 'gold' as LightColor },
]

const SOURCES = [
  { id: 0, startPos: { c: 0, r: 2, dir: 'RIGHT' as Dir }, color: 'blue' as LightColor },
  { id: 1, startPos: { c: 0, r: 4, dir: 'RIGHT' as Dir }, color: 'gold' as LightColor },
]

export class DomeLightScene extends Phaser.Scene {
  private overlayOpen = false
  private completed = false

  private grid: number[][] = []
  private mirrors: ('/' | '\\')[][] = []
  private mirrorColors: (LightColor | null)[][] = []
  private mirrorTypes: ('normal' | 'filter')[][] = []

  private lightGraphics: Phaser.GameObjects.Graphics[] = []
  private mirrorSprites: Phaser.GameObjects.Container[][] = []
  private targetSprites: Phaser.GameObjects.Container[] = []

  private currentFilter: 'blue' | 'gold' = 'blue' 
  private colorPickerBtns: Record<string, Phaser.GameObjects.Container> = {}

  constructor() {
    super('DomeLightScene')
  }

  create() {
    this.overlayOpen = false
    this.completed = false
    this.initGrid()

    paintDome(this)
    this.buildHud()
    this.drawGrid()
    this.drawTargets()
    this.drawLightSources()
    this.buildColorPicker()

    this.lightGraphics = [
      this.add.graphics().setDepth(100),
      this.add.graphics().setDepth(101)
    ]

    this.traceLight()
    this.buildControls()
  }

  private initGrid() {
    this.grid = []
    this.mirrors = []
    this.mirrorColors = []
    this.mirrorTypes = []
    this.mirrorSprites = []
    for (let r = 0; r < GRID_SIZE; r++) {
      this.grid[r] = []
      this.mirrors[r] = []
      this.mirrorColors[r] = []
      this.mirrorTypes[r] = []
      this.mirrorSprites[r] = []
      for (let c = 0; c < GRID_SIZE; c++) {
        this.grid[r][c] = 0
        this.mirrors[r][c] = '/'
        this.mirrorColors[r][c] = null
        this.mirrorTypes[r][c] = 'normal'
      }
    }
  }

  private drawGrid() {
    const g = this.add.graphics().setDepth(10)
    g.lineStyle(2, 0x2b4162, 0.4)
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        g.fillStyle(0xffffff, 0.2)
        g.fillRect(START_X + c * TILE_SIZE, START_Y + r * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        g.strokeRect(START_X + c * TILE_SIZE, START_Y + r * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      }
    }

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const x = START_X + c * TILE_SIZE + TILE_SIZE / 2
        const y = START_Y + r * TILE_SIZE + TILE_SIZE / 2
        
        const hitArea = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0xffffff, 0)
          .setInteractive({ useHandCursor: true })
          .setDepth(15) 

        hitArea.on('pointerdown', () => {
          if (this.grid[r][c] === 1) return
          if (SOURCES.some(s => s.startPos.c === c && s.startPos.r === r)) return
          if (TARGETS.some(t => t.c === c && t.r === r)) return

          this.grid[r][c] = 1
          this.mirrors[r][c] = '/'
          this.mirrorTypes[r][c] = 'filter'
          this.mirrorColors[r][c] = this.currentFilter

          this.createMirrorVisual(c, r, 'filter', this.currentFilter, true)
          this.traceLight()
        })
      }
    }
  }

  private drawTargets() {
    TARGETS.forEach(t => {
      const x = START_X + t.c * TILE_SIZE + TILE_SIZE / 2
      const y = START_Y + t.r * TILE_SIZE + TILE_SIZE / 2
      
      const container = this.add.container(x, y).setDepth(20)
      const g = this.add.graphics()
      
      const drawTarget = (isLit: boolean) => {
        g.clear()
        const colorHex = t.color === 'blue' ? 0x4a90e2 : 0xffd700
        g.lineStyle(3, colorHex, isLit ? 1 : 0.4)
        g.strokeCircle(0, 0, 20)
        g.fillStyle(colorHex, isLit ? 0.8 : 0.2)
        g.fillCircle(0, 0, 15)
      }
      
      drawTarget(false)
      container.add(g)
      container.setData('targetColor', t.color)
      container.setData('isLit', false)
      container.setData('drawFn', drawTarget)
      
      this.targetSprites.push(container)
      this.tweens.add({ targets: container, alpha: 0.6, duration: 800, yoyo: true, repeat: -1 })
    })
  }

  private drawLightSources() {
    SOURCES.forEach(s => {
      const x = START_X + s.startPos.c * TILE_SIZE + TILE_SIZE / 2
      const y = START_Y + s.startPos.r * TILE_SIZE + TILE_SIZE / 2
      
      const source = this.add.graphics().setDepth(20)
      const hex = s.color === 'blue' ? 0x4a90e2 : 0xffd700
      
      source.fillStyle(hex, 1)
      source.fillCircle(x, y, 15)
      source.fillStyle(0xffffff, 0.8)
      source.fillCircle(x, y, 5)
    })
  }

  private createMirrorVisual(
    c: number, r: number, 
    mirrorType: 'normal' | 'filter', 
    color: LightColor | null, 
    interactive = true
  ) {
    const x = START_X + c * TILE_SIZE + TILE_SIZE / 2
    const y = START_Y + r * TILE_SIZE + TILE_SIZE / 2
    const container = this.add.container(x, y).setDepth(50)
    const g = this.add.graphics()
    
    const drawMirror = () => {
      g.clear()
      if (mirrorType === 'filter') {
        g.fillStyle(color === 'blue' ? 0x4a90e2 : 0xffd700, 0.8)
      } else {
        g.fillStyle(0x8898aa, 1)
      }
      g.fillCircle(0, 0, 22)
      g.lineStyle(2, 0xffffff, 0.8)
      g.strokeCircle(0, 0, 22)
      
      g.lineStyle(4, 0xffffff, 1)
      g.beginPath()
      if (this.mirrors[r][c] === '/') { g.moveTo(-12, 12); g.lineTo(12, -12) } 
      else { g.moveTo(-12, -12); g.lineTo(12, 12) }
      g.strokePath()
    }

    drawMirror()
    container.add(g)
    
    if (interactive) {
      container.setSize(44, 44).setInteractive({ useHandCursor: true })
      container.on('pointerdown', () => {
        this.mirrors[r][c] = this.mirrors[r][c] === '/' ? '\\' : '/'
        drawMirror()
        this.traceLight()
      })
    }
    this.mirrorSprites[r][c] = container
  }

  private buildColorPicker() {
    const panelX = 150
    const panelY = 400
    roundedPanel(this, panelX - 80, panelY - 80, 160, 200).setDepth(100)

    this.add.text(panelX, panelY - 60, '琉璃滤片', {
      fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(101)

    const colors: ('blue' | 'gold')[] = ['blue', 'gold']
    colors.forEach((c, i) => {
      const y = panelY - 10 + i * 60
      const btn = this.add.container(panelX, y).setDepth(101)
      
      const bg = this.add.graphics()
      const drawBtn = (selected: boolean) => {
        bg.clear()
        bg.fillStyle(c === 'blue' ? 0x4a90e2 : 0xffd700, 1)
        bg.fillRoundedRect(-50, -20, 100, 40, 8)
        bg.lineStyle(selected ? 4 : 2, selected ? 0xffffff : 0x000000, 1)
        bg.strokeRoundedRect(-50, -20, 100, 40, 8)
      }
      drawBtn(false)
      
      const txt = this.add.text(0, 0, c === 'blue' ? '蓝光' : '金光', {
        fontFamily: UI_FONT, fontSize: '16px', color: '#ffffff'
      }).setOrigin(0.5)
      
      btn.add([bg, txt])
      btn.setSize(100, 40).setInteractive({ useHandCursor: true })
      
      btn.on('pointerdown', () => {
        this.currentFilter = c
        colors.forEach(k => {
          const g = this.colorPickerBtns[k].getAt(0) as Phaser.GameObjects.Graphics
          g.clear()
          g.fillStyle(k === 'blue' ? 0x4a90e2 : 0xffd700, 1)
          g.fillRoundedRect(-50, -20, 100, 40, 8)
          const isSel = k === c
          g.lineStyle(isSel ? 4 : 2, isSel ? 0xffffff : 0x000000, 1)
          g.strokeRoundedRect(-50, -20, 100, 40, 8)
        })
      })
      
      this.colorPickerBtns[c] = btn
    })
  }

  private traceLight() {
    this.lightGraphics[0].clear()
    this.lightGraphics[1].clear()

    this.targetSprites.forEach(t => {
      t.setData('isLit', false)
      t.setAlpha(0.6)
      const drawFn = t.getData('drawFn')
      if (drawFn) drawFn(false)
    })

    SOURCES.forEach((source, index) => {
      let c = source.startPos.c
      let r = source.startPos.r
      let dir = source.startPos.dir
      let currentColor: LightColor = source.color
      let steps = 0

      const points: { x: number, y: number }[] = []
      points.push({ 
        x: START_X + c * TILE_SIZE + TILE_SIZE / 2, 
        y: START_Y + r * TILE_SIZE + TILE_SIZE / 2 
      })

      while (steps < 100) {
        let nextC = c, nextR = r
        if (dir === 'UP') nextR--
        if (dir === 'DOWN') nextR++
        if (dir === 'LEFT') nextC--
        if (dir === 'RIGHT') nextC++

        if (nextC < 0 || nextC >= GRID_SIZE || nextR < 0 || nextR >= GRID_SIZE) {
          points.push({ 
            x: START_X + nextC * TILE_SIZE + TILE_SIZE / 2, 
            y: START_Y + nextR * TILE_SIZE + TILE_SIZE / 2 
          })
          break
        }

        c = nextC; r = nextR
        points.push({ 
          x: START_X + c * TILE_SIZE + TILE_SIZE / 2, 
          y: START_Y + r * TILE_SIZE + TILE_SIZE / 2 
        })

        const target = TARGETS.find(t => t.c === c && t.r === r)
        if (target) {
          const tSprite = this.targetSprites.find(t => t.getData('targetColor') === target.color)
          if (tSprite && currentColor === target.color && !tSprite.getData('isLit')) {
            tSprite.setData('isLit', true)
            tSprite.setAlpha(1)
            const drawFn = tSprite.getData('drawFn')
            if (drawFn) drawFn(true)
          }
          break
        }

        if (this.grid[r][c] === 1) {
          if (this.mirrorTypes[r][c] === 'filter') {
            currentColor = this.mirrorColors[r][c]!
          }

          const mirror = this.mirrors[r][c]
          if (mirror === '/') {
            if (dir === 'RIGHT') dir = 'UP'
            else if (dir === 'LEFT') dir = 'DOWN'
            else if (dir === 'UP') dir = 'RIGHT'
            else if (dir === 'DOWN') dir = 'LEFT'
          } else {
            if (dir === 'RIGHT') dir = 'DOWN'
            else if (dir === 'LEFT') dir = 'UP'
            else if (dir === 'UP') dir = 'LEFT'
            else if (dir === 'DOWN') dir = 'RIGHT'
          }
        }
        steps++
      }

      let glowHex = 0xffffff
      let coreHex = 0xffffff
      if (currentColor === 'blue') { glowHex = 0x4a90e2; coreHex = 0x00ffff; }
      if (currentColor === 'gold') { glowHex = 0xffd700; coreHex = 0xffea00; }

      this.lightGraphics[index].lineStyle(10, glowHex, 0.2)
      this.lightGraphics[index].beginPath()
      this.lightGraphics[index].moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) this.lightGraphics[index].lineTo(points[i].x, points[i].y)
      this.lightGraphics[index].strokePath()

      this.lightGraphics[index].lineStyle(4, coreHex, 1)
      this.lightGraphics[index].beginPath()
      this.lightGraphics[index].moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) this.lightGraphics[index].lineTo(points[i].x, points[i].y)
      this.lightGraphics[index].strokePath()
    })

    this.checkWin()
  }

  private checkWin() {
    const allLit = this.targetSprites.every(t => t.getData('isLit') === true)
    if (allLit && !this.completed) {
      this.completed = true
      this.showToast('八面圣墙光斑全部点亮！')
      this.cameras.main.flash(1000, 255, 255, 255)
      this.time.delayedCall(1500, () => this.showKnowledgeCard())
    }
  }

  private buildControls() {
    textButton(this, 640, 650, '重置光路', () => { this.scene.restart() }).setDepth(2000)
  }

  private buildHud() {
    const hud = roundedPanel(this, 28, 24, 420, 92).setDepth(2000)
    hud.setScrollFactor(0)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    
    this.add.text(48, 70, '双光源！用滤色片引导蓝光和金光各自击中对应靶心', { 
      fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354', wordWrap: { width: 380 } 
    }).setDepth(2001)

    textButton(this, 1150, 100, '重 来', () => { this.scene.restart() }).setDepth(2001)
  }

  private showKnowledgeCard() {
    if (this.overlayOpen) return
    this.overlayOpen = true
    showKnowledgeCard(this, LEVEL.knowledgeCard, () => this.showSuccess())
  }

  private showSuccess() {
    // 🌟 1. 标记通关
    LevelProgress.markCompleted(LEVEL.id)

    // 🌟 2. 发金币（如果没重置过光路就算完美）
    const isPerfect = true // 光路关没有失误计数，默认完美
    const reward = CoinSystem.rewardLevel(LEVEL.id, isPerfect)
    CoinSystem.showFloatText(this, reward)

    this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.5).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, LEVEL.successTitle, { fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f' }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, LEVEL.successBody, { fontFamily: UI_FONT, fontSize: '18px', color: '#6a635b', wordWrap: { width: 560 }, align: 'center' }).setOrigin(0.5, 0).setDepth(5002)
    
    textButton(this, 640, 460, '返回世界', () => { this.scene.start('WorldDetailScene', { worldId: 'dome-rock' }) }).setDepth(5002)
  }

  private showToast(msg: string) {
    const t = this.add.text(640, 160, msg, { fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f', backgroundColor: '#efe6d8ee', padding: { x: 14, y: 8 } }).setOrigin(0.5).setDepth(4000).setAlpha(0)
    this.tweens.add({ targets: t, alpha: 1, y: 148, duration: 220, yoyo: true, hold: 1400, onComplete: () => t.destroy() })
  }
}