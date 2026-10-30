import Phaser from 'phaser'
import { UI_FONT, palette } from '../palette.ts'
import { textButton, roundedPanel } from '../ui/panels.ts'
import { AudioSystem } from '../systems/AudioSystem.ts'
import { WORLD_STORIES } from '../data/stories.ts'

const NPC_CONFIG: Record<string, { name: string, emoji: string, color: number }> = {
  'forbidden-city': { name: '紫禁守礼太史', emoji: '🧑‍🏫', color: 0xa83232 }, 
  'suzhou-garden': { name: '老园丁温篇', emoji: '👴', color: 0x2e8b57 },    
  'yingxian-pagoda': { name: '古塔老匠人', emoji: '👷', color: 0x8b4513 },   
  'egypt-pyramid': { name: '埃及法老', emoji: '🧔‍♂️', color: 0xd4a338 },      
  'petra': { name: '沙漠先民', emoji: '🧕', color: 0xcd853f },             
  'dome-rock': { name: '几何圣匠', emoji: '🧙‍♂️', color: 0x2b4162 },         
  'angkor': { name: '高棉壁画守卷人', emoji: '🧑‍🎨', color: 0x8fbc8f },     
  'machu-picchu': { name: '印加守山卫士', emoji: '💂', color: 0x4682b4 }   
}

export class StoryIntroScene extends Phaser.Scene {
  constructor() {
    super('StoryIntroScene')
  }

  create(data: { worldId: string, nextScene: string }) {
    this.add.rectangle(640, 360, 1280, 720, 0x1a1614)
    
    // 底板（高度 480）
    roundedPanel(this, 340, 120, 700, 480, palette.paper)
    
    this.add.text(690, 165, '序 章', {
      fontFamily: UI_FONT, fontSize: '28px', color: '#8c3b2b', fontStyle: 'bold'
    }).setOrigin(0.5)

    const fullText = WORLD_STORIES[data.worldId] || '暂无剧情文本。'
    
    // 🌟 核心修复：自动缩放字号
    let fontSize = 18;
    const maxTextHeight = 320; // 面板内留给文字的最大高度
    
    // 先创建一个不可见的文本对象来测试高度
    const testText = this.add.text(380, 220, fullText, {
      fontFamily: UI_FONT, fontSize: `${fontSize}px`, 
      wordWrap: { width: 620 }, lineSpacing: 10
    }).setVisible(false)

    // 如果高度超标，就不断缩小字号直到塞进去
    while (testText.height > maxTextHeight && fontSize > 12) {
      fontSize -= 1;
      testText.setFontSize(fontSize);
    }
    testText.destroy(); // 测试完毕，销毁

    // 使用最终计算出的安全字号来渲染剧情文字
    const storyTextObj = this.add.text(380, 220, '', {
      fontFamily: UI_FONT, 
      fontSize: `${fontSize}px`, 
      color: '#4a453f', 
      wordWrap: { width: 620 }, 
      lineSpacing: 10 
    })
    
    let charIndex = 0
    const typingEvent = this.time.addEvent({
      delay: 30,
      repeat: fullText.length - 1,
      callback: () => {
        storyTextObj.text += fullText[charIndex]
        charIndex++
      }
    })

    const npcInfo = NPC_CONFIG[data.worldId] || { name: '神秘人', emoji: '👤', color: 0x333333 }
    this.drawNpcAvatar(180, 360, npcInfo)

    // 按钮稳稳地放在底板上（Y=550）
    const btn = textButton(this, 690, 550, '进入世界', () => {
      AudioSystem.playSFX('click')
      this.scene.start(data.nextScene)
    }).setAlpha(0)
    
    textButton(this, 1150, 660, '跳过 >>', () => {
      this.scene.start(data.nextScene)
    }).setDepth(100).setAlpha(0.6)

    this.time.delayedCall(fullText.length * 30 + 300, () => {
      this.tweens.add({ targets: btn, alpha: 1, duration: 300 })
    })
    
    this.input.once('pointerdown', () => {
      typingEvent.remove()
      storyTextObj.text = fullText
      this.tweens.add({ targets: btn, alpha: 1, duration: 300 })
    })
  }

  private drawNpcAvatar(cx: number, cy: number, npc: { name: string, emoji: string, color: number }) {
    const container = this.add.container(cx, cy).setDepth(10)

    const bg = this.add.graphics()
    bg.fillStyle(npc.color, 0.1)
    bg.fillRoundedRect(-110, -160, 220, 320, 16)
    bg.lineStyle(4, npc.color, 0.8)
    bg.strokeRoundedRect(-110, -160, 220, 320, 16)
    
    const innerG = this.add.graphics()
    innerG.lineStyle(2, npc.color, 0.3)
    innerG.strokeRoundedRect(-100, -150, 200, 300, 12)

    const avatarText = this.add.text(0, -40, npc.emoji, { fontSize: '90px' }).setOrigin(0.5)
    
    const nameBg = this.add.graphics()
    nameBg.fillStyle(npc.color, 1)
    nameBg.fillRoundedRect(-90, 70, 180, 40, 8)
    const nameText = this.add.text(0, 90, npc.name, {
      fontFamily: UI_FONT, fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5)

    container.add([bg, innerG, avatarText, nameBg, nameText])

    container.x = -100
    this.tweens.add({
      targets: container,
      x: cx,
      duration: 600,
      ease: 'Back.easeOut'
    })
  }
}