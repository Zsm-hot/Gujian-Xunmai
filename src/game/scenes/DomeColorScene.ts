import { worlds } from '../data/worlds.ts'
import { showCatPostcard } from '../ui/CatPostcardUI.ts'
import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { CoinSystem } from '../systems/CoinSystem.ts' // 🌟 引入金币系统
import { paintDome } from '../world/domeDrawers.ts'
import { domeColorLevel } from '../data/levels/dome-wall.ts'

const LEVEL = domeColorLevel

const COLORS: Record<string, { hex: number; name: string }> = {
  white: { hex: 0xf2f4f5, name: '云石白' },
  gray: { hex: 0xb0bcc4, name: '浅灰纹理' },
  cyan: { hex: 0x2f8fa3, name: '蒂芙尼青' },
  blue: { hex: 0x2b4162, name: '宝蓝琉璃' },
  gold: { hex: 0xd4a338, name: '鎏金描金' },
  darkGold: { hex: 0xa67c21, name: '暗金勾边' },
  black: { hex: 0x1a1a1a, name: '墨黑' },
  red: { hex: 0x8c2b2b, name: '赭红' },
}

type ColorKey = keyof typeof COLORS

interface ZoneRule {
  id: string
  name: string
  requiredColors: ColorKey[] 
  correctColor: ColorKey     
  draw: (g: Phaser.GameObjects.Graphics) => void
  hitTest: (x: number, y: number) => boolean
  hint: string
}

const CX = 680 
const CY = 380

const ZONES: ZoneRule[] = [
  {
    id: 'window',
    name: '窗格边角',
    requiredColors: ['black', 'red', 'white', 'cyan'],
    correctColor: 'black',
    draw: (g) => {
      const windows = [[-140, 90], [-60, 90], [20, 90], [100, 90]]
      windows.forEach(([x, y]) => {
        g.fillStyle(0xffffff, 0.4)
        g.fillRect(x, y, 40, 40)
        g.lineStyle(2, 0xd4a338, 1)
        g.strokeRect(x, y, 40, 40)
      })
    },
    hitTest: (x, y) => {
      const windows = [[-140, 90], [-60, 90], [20, 90], [100, 90]]
      return windows.some(([wx, wy]) => x > wx && x < wx + 40 && y > wy && y < wy + 40)
    },
    hint: '边角点缀不可大面积铺色，宜用墨黑收边（红色为禁忌）。',
  },
  {
    id: 'pattern',
    name: '纹样线条',
    requiredColors: ['gold', 'darkGold', 'black', 'red'],
    correctColor: 'darkGold',
    draw: (g) => { 
      g.lineStyle(6, 0xffffff, 1)
      for(let i=0; i<8; i++) {
        const a = (i/8)*Math.PI*2
        g.beginPath(); g.moveTo(0, 60); g.lineTo(Math.cos(a)*120, 60 + Math.sin(a)*120); g.strokePath()
      }
    },
    hitTest: (x, y) => {
      const dist = Math.sqrt(x*x + (y-60)*(y-60))
      return dist < 90 && y < 60
    },
    hint: '纹样必须用暗金勾边才能凸显层次（红黑为干扰项）。',
  },
  {
    id: 'base',
    name: '基座底层',
    requiredColors: ['white', 'gray', 'gold', 'blue'],
    correctColor: 'white',
    draw: (g) => { g.fillRect(-180, 160, 360, 60); g.strokeRect(-180, 160, 360, 60) },
    hitTest: (x, y) => x > -180 && x < 180 && y > 160 && y < 220,
    hint: '基底不可僭越主色，应使用沉稳素雅之色。',
  },
  {
    id: 'wall',
    name: '墙面主体',
    requiredColors: ['cyan', 'blue', 'red', 'gold', 'darkGold', 'black'],
    correctColor: 'blue', 
    draw: (g) => { 
      g.fillRect(-160, 60, 320, 100); 
      g.strokeRect(-160, 60, 320, 100)
    },
    hitTest: (x, y) => x > -160 && x < 160 && y > 60 && y < 160,
    hint: '主体忌用大面积深红（违背禁忌），需用青蓝琉璃。',
  },
  {
    id: 'dome',
    name: '穹顶区域',
    requiredColors: ['gold', 'blue', 'cyan', 'white'],
    correctColor: 'gold',
    draw: (g) => { 
      g.beginPath(); 
      g.arc(0, 60, 160, Math.PI, 0, false); 
      g.closePath(); 
    },
    hitTest: (x, y) => {
      const dist = Math.sqrt(x*x + (y-60)*(y-60))
      return dist < 160 && y < 60
    },
    hint: '穹顶象征天穹之耀，需用鎏金。',
  }
]

export class DomeColorScene extends Phaser.Scene {
  private overlayOpen = false
  private completed = false

  private zoneStates: Record<string, ColorKey | null> = {}
  private zoneGraphics: Record<string, Phaser.GameObjects.Graphics> = {}
  private selectedZoneId: string | null = null

  private hintText!: Phaser.GameObjects.Text
  private progressText!: Phaser.GameObjects.Text
  private colorBtns: Record<string, Phaser.GameObjects.Container> = {}
  
  // 🌟 记录失误次数用于完美判定
  private attempts = 0

  // 🌟 圣匠气泡
  private npcBubble!: Phaser.GameObjects.Container
  private npcText!: Phaser.GameObjects.Text

  constructor() {
    super('DomeColorScene')
  }

  create() {
    this.overlayOpen = false
    this.completed = false
    this.attempts = 0
    this.zoneStates = {}
    this.zoneGraphics = {}
    this.selectedZoneId = null
    this.colorBtns = {}

    paintDome(this)
    this.buildHud()
    
    // 绘制 NPC 圣匠
    this.drawNpc()

    // 绘制底板
    const baseG = this.add.graphics().setDepth(10)
    baseG.fillStyle(0xefe6d8, 1)
    baseG.fillRect(CX - 200, CY - 120, 400, 360)
    baseG.lineStyle(4, 0xb09a6e, 1)
    baseG.strokeRect(CX - 200, CY - 120, 400, 360)

    this.drawZones()

    this.hintText = this.add.text(640, 580, '点击上方区域，然后拖拽下方色卡填色', {
      fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f', backgroundColor: '#efe6d8ee', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(2000)

    this.updateProgress()
    
    // 初始对话
    this.showNpcMessage('圣墙的釉色有着严格的礼制，请小心复原。')
  }

  // 🌟 绘制几何圣匠
  private drawNpc() {
    const npcX = 200
    const npcY = 350

    // 绘制身体（几何菱形斗篷）
    const g = this.add.graphics().setDepth(100)
    g.fillStyle(0x2b4162, 1) // 深蓝
    g.beginPath()
    g.moveTo(npcX, npcY - 60)
    g.lineTo(npcX + 60, npcY + 60)
    g.lineTo(npcX - 60, npcY + 60)
    g.closePath()
    g.fillPath()

    // 绘制头部（圆形）
    g.fillStyle(0xd4a338, 1)
    g.fillCircle(npcX, npcY - 80, 30)

    // 绘制几何眼睛
    g.fillStyle(0x1a1a1a, 1)
    g.fillRect(npcX - 15, npcY - 85, 6, 6)
    g.fillRect(npcX + 9, npcY - 85, 6, 6)

    // 绘制星光法杖
    g.lineStyle(4, 0xa67c21, 1)
    g.beginPath()
    g.moveTo(npcX + 50, npcY + 50)
    g.lineTo(npcX + 70, npcY - 50)
    g.strokePath()
    
    g.fillStyle(0xffd700, 1)
    g.fillCircle(npcX + 70, npcY - 50, 10)

    // 名字标签
    this.add.text(npcX, npcY + 80, '几何圣匠 · 古境纹饰师', {
      fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(100)

    // 🌟 对话气泡
    this.npcBubble = this.add.container(npcX, npcY - 140).setDepth(150).setAlpha(0)
    const bubbleBg = this.add.graphics()
    bubbleBg.fillStyle(0xffffff, 0.9)
    bubbleBg.fillRoundedRect(-150, -40, 300, 80, 10)
    // 气泡小尾巴
    bubbleBg.beginPath()
    bubbleBg.moveTo(-10, 40)
    bubbleBg.lineTo(10, 40)
    bubbleBg.lineTo(0, 55)
    bubbleBg.closePath()
    bubbleBg.fillPath()
    bubbleBg.lineStyle(2, 0xb09a6e, 1)
    bubbleBg.strokeRoundedRect(-150, -40, 300, 80, 10)

    this.npcText = this.add.text(0, 0, '', {
      fontFamily: UI_FONT, fontSize: '14px', color: '#4a453f',
      wordWrap: { width: 270 }, align: 'center'
    }).setOrigin(0.5)

    this.npcBubble.add([bubbleBg, this.npcText])
  }

  // 触发圣匠气泡对话
  private showNpcMessage(msg: string) {
    this.npcText.setText(msg)
    this.npcBubble.setAlpha(1)
    this.npcBubble.y = 210 - 10
    
    this.tweens.add({
      targets: this.npcBubble,
      y: 210,
      duration: 300,
      ease: 'Back.easeOut'
    })
  }

  private drawZones() {
    ZONES.forEach(zone => {
      let depth = 20
      if (zone.id === 'window' || zone.id === 'pattern') depth = 25
      
      const g = this.add.graphics({ x: CX, y: CY }).setDepth(depth)
      this.zoneGraphics[zone.id] = g
      this.zoneStates[zone.id] = null
      this.redrawZone(zone)
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.completed) return
      const localX = pointer.x - CX
      const localY = pointer.y - CY
      
      let isHovering = false
      ZONES.forEach(zone => {
        if (zone.hitTest(localX, localY)) {
          isHovering = true
          this.input.setDefaultCursor('pointer')
        }
      })
      if (!isHovering) this.input.setDefaultCursor('default')
    })

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.completed) return
      if (pointer.y > 600) return 

      const localX = pointer.x - CX
      const localY = pointer.y - CY

      const clickedZone = ZONES.find(z => z.hitTest(localX, localY))
      if (clickedZone) {
        this.selectZone(clickedZone)
      }
    })
  }

  private selectZone(zone: ZoneRule) {
    this.selectedZoneId = zone.id
    this.hintText.setText(`当前选中：【${zone.name}】 ${zone.hint}`)
    
    // 让圣匠提示
    this.showNpcMessage(`你选中了【${zone.name}】。\n${zone.hint}`)

    ZONES.forEach(z => {
      this.redrawZone(z, z.id === zone.id)
    })

    this.buildDraggableColors(zone.requiredColors)
  }

  private redrawZone(zone: ZoneRule, isSelected = false) {
    const g = this.zoneGraphics[zone.id]
    g.clear()

    const currentColor = this.zoneStates[zone.id]
    
    if (!currentColor) {
      g.fillStyle(0x000000, 0.05)
      g.lineStyle(2, 0x999999, 0.5)
      zone.draw(g)
      if (!zone.id.includes('pattern') && !zone.id.includes('window')) {
        g.fillPath()
      }
      g.strokePath()
    } else {
      const cHex = COLORS[currentColor].hex
      g.fillStyle(cHex, 1)
      g.lineStyle(2, 0xffffff, 0.4)
      
      if (zone.id === 'pattern') {
        g.lineStyle(8, cHex, 1)
        for(let i=0; i<8; i++) {
          const a = (i/8)*Math.PI*2
          g.beginPath(); g.moveTo(0, 60); g.lineTo(Math.cos(a)*120, 60 + Math.sin(a)*120); g.strokePath()
        }
        g.fillStyle(cHex, 1); g.fillCircle(0, 60, 18)
      } else if (zone.id === 'window') {
        const windows = [[-140, 90], [-60, 90], [20, 90], [100, 90]]
        windows.forEach(([x, y]) => {
          g.fillStyle(cHex, 1)
          g.fillRect(x, y, 40, 40)
          g.lineStyle(2, 0xffffff, 0.5)
          g.strokeRect(x, y, 40, 40)
        })
      } else {
        zone.draw(g)
        g.fillPath()
        g.strokePath()
      }
    }

    if (isSelected) {
      g.lineStyle(4, 0xd4a338, 1)
      g.strokeRect(-195, -115, 390, 350)
    }
  }

  private buildDraggableColors(allowedColors: ColorKey[]) {
    Object.values(this.colorBtns).forEach(btn => btn.destroy())
    this.colorBtns = {}

    const startX = 640 - (allowedColors.length * 100) / 2 + 50

    allowedColors.forEach((colorKey, index) => {
      const x = startX + index * 100
      const homeY = 680
      
      const cData = COLORS[colorKey]
      const btn = this.add.container(x, homeY).setDepth(2000)
      
      const bg = this.add.graphics()
      bg.fillStyle(cData.hex, 1)
      bg.fillRoundedRect(-40, -25, 80, 50, 8)
      bg.lineStyle(2, 0xffffff, 0.8)
      bg.strokeRoundedRect(-40, -25, 80, 50, 8)
      
      const txt = this.add.text(0, 0, cData.name, {
        fontFamily: UI_FONT, fontSize: '14px', color: colorKey === 'white' || colorKey === 'gray' ? '#000000' : '#ffffff'
      }).setOrigin(0.5)
      
      btn.add([bg, txt])
      btn.setSize(80, 50).setInteractive({ useHandCursor: true, draggable: true })
      
      this.colorBtns[colorKey] = btn

      btn.on('dragstart', () => {
        btn.setDepth(3000)
        btn.setScale(1.2)
      })

      btn.on('drag', (_p: any, dragX: number, dragY: number) => {
        btn.x = dragX
        btn.y = dragY
      })

      btn.on('dragend', () => {
        btn.setDepth(2000)
        btn.setScale(1)
        
        const pointer = this.input.activePointer
        const localX = pointer.x - CX
        const localY = pointer.y - CY

        const currentZone = ZONES.find(z => z.id === this.selectedZoneId)
        
        if (currentZone && currentZone.hitTest(localX, localY)) {
          this.applyColorToZone(currentZone.id, colorKey)
        }

        this.tweens.add({
          targets: btn,
          x: x,
          y: homeY,
          duration: 300,
          ease: 'Back.easeOut'
        })
      })
    })
  }

  private applyColorToZone(zoneId: string, colorKey: ColorKey) {
    const zone = ZONES.find(z => z.id === zoneId)!
    
    if (!zone.requiredColors.includes(colorKey)) {
      this.showNpcMessage('此色不合礼制，不可使用。')
      this.attempts++ // 🌟 记录失误
      return
    }

    if (colorKey === zone.correctColor) {
      this.zoneStates[zone.id] = colorKey
      this.redrawZone(zone, true)
      this.showNpcMessage(`${zone.name} 复原成功，秩序正在回归。`)
      
      const flash = this.add.circle(CX, CY, 100, 0xffffff, 0.4).setDepth(100)
      this.tweens.add({ targets: flash, alpha: 0, scale: 2, duration: 400, onComplete: () => flash.destroy() })
      
      this.updateProgress()
      this.checkWin()
    } else {
      let errorMsg = '色彩不合礼制'
      if (zone.id === 'base' && colorKey === 'gold') errorMsg = '基底不可僭越主色！'
      else if (zone.id === 'wall' && colorKey === 'red') errorMsg = '违背伊斯兰配色禁忌，判定复原失败！'
      else if (zone.id === 'pattern' && colorKey !== 'darkGold') errorMsg = '纹样漏金勾边，层次缺失，圣境不完整！'
      else if (zone.id === 'window' && colorKey !== 'black') errorMsg = '边角点缀不可大面积铺色！'
      
      this.showNpcMessage(errorMsg)
      this.attempts++ // 🌟 记录失误
      this.cameras.main.shake(200, 0.01)
    }
  }

  private checkWin() {
    if (this.completed) return
    const total = ZONES.length
    let correctCount = 0
    ZONES.forEach(z => {
      if (this.zoneStates[z.id] === z.correctColor) correctCount++
    })

    if (correctCount === total) {
      this.completed = true
      this.showNpcMessage('圣境复原！色彩层次完美复刻传世原貌！')
      this.cameras.main.flash(1500, 255, 255, 255)
      this.time.delayedCall(1500, () => this.showKnowledgeCard())
    }
  }

  private buildHud() {
    const hud = roundedPanel(this, 28, 24, 420, 92).setDepth(2000)
    hud.setScrollFactor(0)
    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f' }).setDepth(2001)
    
    this.progressText = this.add.text(48, 70, '复原进度：0 / 5', { 
      fontFamily: UI_FONT, fontSize: '14px', color: '#7d6354' 
    }).setDepth(2001)

    textButton(this, 1150, 100, '重 来', () => { this.scene.restart() }).setDepth(2001)
  }

  private updateProgress() {
    const total = ZONES.length
    let correctCount = 0
    ZONES.forEach(z => {
      if (this.zoneStates[z.id] === z.correctColor) correctCount++
    })
    this.progressText.setText(`复原进度：${correctCount} / ${total}`)
  }

  private showKnowledgeCard() {
    if (this.overlayOpen) return
    this.overlayOpen = true
    showKnowledgeCard(this, LEVEL.knowledgeCard, () => this.showSuccess())
  }

  private showSuccess() {
    // 🌟 1. 先标记当前关卡通关
    LevelProgress.markCompleted('dome-color') 

    // 🌟 2. 发金币（没填错颜色为完美）
    const isPerfect = this.attempts === 0
    const reward = CoinSystem.rewardLevel('dome-color', isPerfect)
    CoinSystem.showFloatText(this, reward)

    // 🌟 3. 判断圆顶清真寺所有关卡是否都已通关
    const currentWorld = worlds.find(w => w.id === 'dome-rock')
    if (currentWorld?.levels?.every(lv => LevelProgress.isCompleted(lv.id))) {
      showCatPostcard(this, 'dome-rock') // 弹出云遥白猫
    }

    // 4. 渲染原本的成功面板
    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.38).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    
    this.add.text(640, 230, '圣境釉色', { 
      fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f' 
    }).setOrigin(0.5).setDepth(5002)
    
    this.add.text(640, 300, '光影与色彩完美交融，圣墙再次绽放出神圣的辉光。', { 
      fontFamily: UI_FONT, fontSize: '18px', color: '#6a635b', wordWrap: { width: 560 }, align: 'center' 
    }).setOrigin(0.5, 0).setDepth(5002)

    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'dome-rock' })
    }).setDepth(5002);
  }
}