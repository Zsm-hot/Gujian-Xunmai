import Phaser from 'phaser'
import { palette, UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { showKnowledgeCard } from '../ui/KnowledgeCardUI.ts'
import { LevelProgress } from '../systems/LevelProgress.ts'
import { paintPetraCanyon } from '../world/petraDrawers.ts'
import { petraPathLevel } from '../data/levels/petra-path.ts'
import type { PetraLevelConfig, RockNodeConfig } from '../types.ts'
import { CoinSystem } from '../systems/CoinSystem.ts'

const LEVEL = petraPathLevel

export class PetraPathScene extends Phaser.Scene {
  private level!: PetraLevelConfig
  private overlayOpen = false
  private completed = false
  
  private player!: Phaser.GameObjects.Container
  private rocksMap: Map<string, Phaser.GameObjects.Container> = new Map()
  private rocksContainer!: Phaser.GameObjects.Container
  
  private hp = 3
  private maxJumpDist = 280
  private hpText!: Phaser.GameObjects.Text
  private rockCounter = 0

  constructor() {
    super('PetraPathScene')
  }

  create() {
    this.level = petraPathLevel
    this.overlayOpen = false
    this.completed = false
    this.hp = 3
    this.rocksMap.clear()

    // 1. 背景
    paintPetraCanyon(this)

    // 2. 岩石层容器
    this.rocksContainer = this.add.container(0, 0).setDepth(50)
    
    // 3. 生成第一批岩石
    this.generateNewRocks()

    // 4. 创建玩家
    this.createPlayer(this.level.startPos.x, this.level.startPos.y)

    // 5. 创建终点
    this.createExit(this.level.endPos.x, this.level.endPos.y)

    // 6. HUD
    this.buildHud()
  }

  // ===== 动态生成岩石 =====
  private generateNewRocks() {
    // 清空旧石头
    this.rocksContainer.removeAll(true)
    this.rocksMap.clear()

    // 1. 生成 3~4 个随机岩点
    // 必须保证至少有一个岩点在玩家 280 的跳跃范围内
    const playerX = this.player ? this.player.x : this.level.startPos.x
    const playerY = this.player ? this.player.y : this.level.startPos.y

    // 强制生成一块“必踩石”（距离玩家 100~200，高度差不超过 80）
    const safeX = Phaser.Math.Clamp(playerX + Phaser.Math.Between(120, 200), 200, 1000)
    const safeY = Phaser.Math.Clamp(playerY + Phaser.Math.Between(-60, 60), 200, 550)
    
    this.createRockNode({
      id: `r_${this.rockCounter++}`,
      x: safeX,
      y: safeY,
      stable: true // 必踩石一定是稳固的
    })

    // 再随机生成 2~3 个其他石头（有可能出假石头）
    const extraCount = Phaser.Math.Between(2, 3)
    for (let i = 0; i < extraCount; i++) {
      const rx = Phaser.Math.Clamp(safeX + Phaser.Math.Between(100, 250), 200, 1100)
      const ry = Phaser.Math.Clamp(safeY + Phaser.Math.Between(-100, 100), 200, 550)
      const isStable = Math.random() > 0.3 // 70% 概率稳固，30% 概率松动

      // 避免石头和必踩石完全重叠
      const overlap = this.rocksMap.size > 0 && Math.hypot(rx - safeX, ry - safeY) < 50
      if (!overlap) {
        this.createRockNode({
          id: `r_${this.rockCounter++}`,
          x: rx,
          y: ry,
          stable: isStable
        })
      }
    }
  }

  // ===== 创建单个岩石 =====
  private createRockNode(rock: RockNodeConfig) {
    const container = this.add.container(rock.x, rock.y)
    container.setDepth(50)
    
    // 岩石外观
    const g = this.add.graphics()
    g.fillStyle(0x6a2c20, 1) // 基础暗红
    g.fillRect(-20, -15, 40, 30)
    g.lineStyle(2, 0x3a1008, 0.8)
    g.strokeRect(-20, -15, 40, 30)
    g.fillStyle(0x9c4a3a, 1) // 亮红顶面
    g.fillRect(-18, -17, 36, 26)
    
    // 真假视觉差异
    if (rock.stable) {
      g.fillStyle(0xc86850, 0.9)
      g.fillCircle(-8, -8, 8) // 高光
    } else {
      g.lineStyle(3, 0x2a1008, 0.9)
      g.beginPath(); g.moveTo(-12, -12); g.lineTo(12, 12); g.strokePath()
      g.beginPath(); g.moveTo(12, -12); g.lineTo(-12, 12); g.strokePath()
    }

    container.add(g)
    container.setSize(44, 44)
    container.setInteractive({ useHandCursor: true })

    // 点击跳跃
    container.on('pointerdown', () => {
      if (this.overlayOpen || this.completed) return
      this.handleJump(rock, container)
    })

    this.rocksContainer.add(container)
    this.rocksMap.set(rock.id, container)
  }

  // ===== 创建玩家 =====
  private createPlayer(x: number, y: number) {
    this.player = this.add.container(x, y).setDepth(100)
    
    const g = this.add.graphics()
    g.fillStyle(0xe8dcc0, 1)
    g.fillCircle(0, -15, 12)
    g.fillStyle(0x2a4858, 1)
    g.fillCircle(0, -27, 8)
    
    this.player.add(g)
    this.player.setSize(24, 24)
    this.player.setData('startX', x)
    this.player.setData('startY', y)
  }

  // ===== 创建终点 =====
  private createExit(x: number, y: number) {
    const exit = this.add.container(x, y).setDepth(50)
    const g = this.add.graphics()
    g.fillStyle(0xd4a338, 0.3); g.fillCircle(0, 0, 50)
    g.fillStyle(0x3a2210, 1); g.fillRect(-25, -40, 50, 80)
    g.lineStyle(3, 0xd4a338, 1); g.strokeRect(-25, -40, 50, 80)
    exit.add(g)

    exit.setSize(100, 100)
    exit.setInteractive({ useHandCursor: true })
    exit.on('pointerdown', () => {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < 150) {
        this.completeLevel()
      } else {
        this.showToast('距离太远，先沿着岩点跳过去')
      }
    })
  }

  // ===== 核心跳跃与塌陷逻辑 =====
  private handleJump(targetRock: RockNodeConfig, rockContainer: Phaser.GameObjects.Container) {
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetRock.x, targetRock.y)
    
    if (dist > this.maxJumpDist) {
      this.showToast('太远了，跳不过去！')
      return
    }

    // 跳跃动画
    this.tweens.add({
      targets: this.player,
      x: targetRock.x,
      y: targetRock.y,
      duration: 300,
      ease: 'Quad.easeOut',
      onStart: () => this.player.setDepth(200),
      onComplete: () => {
        this.player.setDepth(100)

        if (!targetRock.stable) {
          // 踩到松动岩点
          this.hp -= 1
          this.updateHpUI()
          this.showToast('岩点崩塌，滑落了！')
          this.cameras.main.shake(200, 0.02)

          // ★ 掉落动画
          this.tweens.add({
            targets: rockContainer,
            y: 800,
            angle: Phaser.Math.Between(-90, 90),
            duration: 600,
            onComplete: () => rockContainer.destroy()
          })

          // 玩家滑落回起点
          this.tweens.add({
            targets: this.player,
            x: this.level.startPos.x,
            y: this.level.startPos.y,
            alpha: 0.5,
            duration: 400,
            yoyo: true,
            onComplete: () => {
              this.player.setAlpha(1)
              this.player.x = this.level.startPos.x
              this.player.y = this.level.startPos.y
            }
          })

          if (this.hp <= 0) {
            this.gameOver()
          }
        } else {
          // 踩到稳固岩点
          this.showToast('安全着陆')
          
          // ★ 核心机制：除了终点，其他石头全部崩塌
          this.rocksMap.forEach((node, id) => {
            if (id !== targetRock.id) {
              this.tweens.add({
                targets: node,
                y: 800,
                angle: Phaser.Math.Between(-90, 90),
                duration: 600,
                onComplete: () => node.destroy()
              })
            }
          })

          // 延迟一点点，生成新石头
          this.time.delayedCall(300, () => {
            // 但注意：如果太靠近终点，就不生成新石头了，否则会死锁
            const distToEnd = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.level.endPos.x, this.level.endPos.y)
            if (distToEnd > 150) {
              this.generateNewRocks()
            }
          })

          // 检查是否通关
          const distToEnd = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.level.endPos.x, this.level.endPos.y)
          if (distToEnd < 150) {
            this.completeLevel()
          }
        }
      }
    })
  }

  // ===== HUD =====
  private buildHud() {
    const hud = roundedPanel(this, 28, 24, 360, 92).setDepth(2000)
    hud.setScrollFactor(0)

    this.add.text(48, 38, `${LEVEL.chapter} · ${LEVEL.title}`, {
      fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f'
    }).setDepth(2001)

    this.add.text(48, 70, LEVEL.objective, {
      fontFamily: UI_FONT, fontSize: '16px', color: '#7d6354'
    }).setDepth(2001)

    this.hpText = this.add.text(1230, 38, `生命：${this.hp} / 3`, {
      fontFamily: UI_FONT, fontSize: '18px', color: '#efe6d8'
    }).setOrigin(1, 0).setDepth(2001)

    textButton(this, 1150, 100, '重 来', () => {
      this.scene.restart()
    }).setDepth(2001)
  }

  private updateHpUI() {
    this.hpText.setText(`生命：${this.hp} / 3`)
    if (this.hp === 1) this.hpText.setColor('#d04848')
  }

  private gameOver() {
    this.showToast('生命耗尽，坠落峡谷...')
    this.time.delayedCall(1500, () => this.scene.restart())
  }

  private completeLevel() {
    if (this.completed) return
    this.completed = true
    this.showToast('成功穿越蛇道！')
    this.time.delayedCall(1000, () => this.showKnowledgeCard())
  }

  // ===== 对话 & 知识卡 =====
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
    const body = this.add.text(-340, -10, LEVEL.azhuComment, {
      fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', wordWrap: { width: 740 }
    })
    box.add([panel, icon, label, body])

    this.tweens.add({
      targets: box, alpha: 1, y: 588, duration: 320,
      onComplete: () => {
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: box, alpha: 0, y: 620, duration: 320,
            onComplete: () => { box.destroy(); this.showSuccess() }
          })
        })
      }
    })
  }

  private showSuccess() {
    this.add.rectangle(640, 360, 1280, 720, palette.ink, 0.38).setDepth(5000)
    roundedPanel(this, 310, 180, 660, 320).setDepth(5001)
    this.add.text(640, 230, LEVEL.successTitle, {
      fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f'
    }).setOrigin(0.5).setDepth(5002)
    this.add.text(640, 300, LEVEL.successBody, {
      fontFamily: UI_FONT, fontSize: '18px', color: '#6a635b', wordWrap: { width: 560 }, align: 'center'
    }).setOrigin(0.5, 0).setDepth(5002)

    LevelProgress.markCompleted(LEVEL.id)
    const isPerfect = true 
    const reward = CoinSystem.rewardLevel(this.level.id, isPerfect)
    CoinSystem.showFloatText(this, reward)

    textButton(this, 640, 460, '返回世界', () => {
      this.scene.start('WorldDetailScene', { worldId: 'petra' })
    }).setDepth(5002)
  }

  private showToast(msg: string) {
    const t = this.add.text(640, 120, msg, {
      fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f',
      backgroundColor: '#efe6d8ee', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(4000).setAlpha(0)

    this.tweens.add({
      targets: t, alpha: 1, y: 108, duration: 220, yoyo: true, hold: 1400,
      onComplete: () => t.destroy()
    })
  }
}