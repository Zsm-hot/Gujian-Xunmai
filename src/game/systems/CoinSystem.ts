import Phaser from 'phaser'
import { UI_FONT } from '../palette.ts'
import { roundedPanel } from '../ui/panels.ts'
import { AudioSystem } from './AudioSystem.ts'

// 🌟 难度金币总配置表
const LEVEL_REWARDS: Record<string, { base: number, perfect: number }> = {
  // 故宫
  'forbidden-city-hall': { base: 40, perfect: 20 },
  'forbidden-city-ridge': { base: 50, perfect: 30 },
  'forbidden-city-flower-street': { base: 50, perfect: 50 },
  // 江南
  'garden-fish': { base: 60, perfect: 40 },
  'garden-cat': { base: 50, perfect: 30 },
  'garden-goose': { base: 60, perfect: 40 },
  'garden-well': { base: 80, perfect: 50 },
  // 木塔
  'wood-timber': { base: 60, perfect: 30 },
  'wood-dougong': { base: 70, perfect: 50 },
  'wood-stacking': { base: 80, perfect: 50 },
  'wood-load': { base: 100, perfect: 80 },
  // 金字塔
  'egypt-mural': { base: 60, perfect: 40 },
  'egypt-spot': { base: 70, perfect: 40 },
  'egypt-stealth': { base: 100, perfect: 80 },
  'egypt-final': { base: 120, perfect: 100 },
  // 佩特拉
  'petra-path': { base: 60, perfect: 40 },
  'petra-camel': { base: 80, perfect: 50 },
  'petra-canal': { base: 80, perfect: 50 },
  'petra-water': { base: 100, perfect: 80 },
  // 清真寺
  'dome-wall': { base: 80, perfect: 50 },
  'dome-light': { base: 100, perfect: 80 },
  'dome-color': { base: 100, perfect: 80 },
  // 吴哥窟
  'angkor-gallery': { base: 120, perfect: 100 },
  'angkor-pool': { base: 120, perfect: 100 },
  // 马丘比丘
  'machu-spot': { base: 80, perfect: 50 },
  'machu-defense': { base: 120, perfect: 100 },
  'machu-quarry': { base: 100, perfect: 80 },
  'machu-llama': { base: 200, perfect: 150 },
}

export class CoinSystem {
  private static readonly KEY = 'gujian-xunmai:coins'

  static getCoins(): number {
    const val = localStorage.getItem(this.KEY)
    return val ? parseInt(val, 10) : 0
  }

  static addCoins(amount: number) {
    const current = this.getCoins()
    localStorage.setItem(this.KEY, (current + amount).toString())
  }

  static spendCoins(amount: number): boolean {
    const current = this.getCoins()
    if (current >= amount) {
      localStorage.setItem(this.KEY, (current - amount).toString())
      return true
    }
    return false
  }

  /** 🌟 统一的发钱方法 */
  static rewardLevel(levelId: string, isPerfect: boolean): number {
    const config = LEVEL_REWARDS[levelId]
    if (!config) {
      console.warn(`[CoinSystem] 找不到关卡 ${levelId} 的金币配置！`)
      return 0
    }

    // ==========================================
    // 🚨 测试开关：设为 true 时不检查重复领取，每次通关都给钱！
    // 🚨 等全部测试完毕，准备上线了，把这里改成 false 即可！
    // ==========================================
    const isTesting = true 

    if (!isTesting) {
      const rewardKey = `gujian-xunmai:rewarded:${levelId}`
      if (localStorage.getItem(rewardKey) === 'true') {
        return 0 // 已经领过，不重复给
      }
      localStorage.setItem(rewardKey, 'true')
    }

    const totalReward = config.base + (isPerfect ? config.perfect : 0)
    this.addCoins(totalReward)
    return totalReward
  }

  /** 🌟 通用的金币飘字特效 */
    /** 🌟 通用的金币飘字特效（绝对醒目版） */
  static showFloatText(scene: Phaser.Scene, reward: number) {
    AudioSystem.playSFX('coin') 
    if (reward <= 0) return
    
    // 1. 把字放在屏幕正中央，并且把层级拉到最高（100000）
    const floatText = scene.add.text(640, 360, `🪙 获得金币 +${reward}`, { 
      fontFamily: UI_FONT, 
      fontSize: '36px', // 🌟 字体加大
      color: '#ffd700', // 🌟 纯金色
      fontStyle: 'bold',
      backgroundColor: '#2d1c10ee', // 🌟 深木色背景，防止被其他UI穿透
      padding: { x: 30, y: 15 },
      stroke: '#4a453f',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(100000)

    // 2. 飘字动画：先放大弹出，停顿一下，再往上飘并消失
    scene.tweens.add({
      targets: floatText,
      scale: { from: 0.5, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    })

    scene.tweens.add({
      targets: floatText,
      y: 200,
      alpha: 0,
      delay: 2500, // 🌟 停在屏幕中间 1 秒钟让你看清
      duration: 1500,
      ease: 'Power2',
      onComplete: () => floatText.destroy()
    })
  }
}

export function renderCoinHUD(scene: Phaser.Scene, depth = 2000) {
  const coins = CoinSystem.getCoins()
  const container = scene.add.container(1100, 40).setDepth(depth)
  const bg = roundedPanel(scene, -70, -20, 140, 40, 0xefe6d8).setAlpha(0.9)
  const icon = scene.add.text(-45, 0, '🪙', { fontSize: '20px' }).setOrigin(0.5)
  const text = scene.add.text(10, 0, `${coins}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#8a5a24', fontStyle: 'bold' }).setOrigin(0.5)
  container.add([bg, icon, text])
}