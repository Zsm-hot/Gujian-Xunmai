import Phaser from 'phaser'
import { UI_FONT } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { CATS } from '../data/cats.ts'

export function showCatPostcard(scene: Phaser.Scene, worldId: string) {
  const cat = CATS[worldId]
  if (!cat) return

  const imagePath = `/assets/${cat.imageKey}.jpg`

  if (!scene.textures.exists(cat.imageKey)) {
    scene.load.image(cat.imageKey, imagePath)
    scene.load.start()
  }

  // 1. 黑色半透明遮罩
  const overlay = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8)
    .setDepth(10000)
    .setInteractive() 

  // 2. 明信片底座（460 x 720）
  const cardW = 460
  const cardH = 720 
  const card = scene.add.container(640, 360).setDepth(10001)
  const panel = roundedPanel(scene, -cardW / 2, -cardH / 2, cardW, cardH, 0xfcf9f2) 
  card.add(panel)

  // ================= 坐标计算 =================
  const topY = -cardH / 2 
  const tagY = topY + 40   
  const imgY = topY + 280  
  const nameY = topY + 500 
  const breedY = topY + 540 
  const poemY = topY + 600 
  const sealY = topY + 650 
  const btnY = topY + 690  

  // 顶部标签
  const tag = scene.add.text(0, tagY, `【${cat.name}】明信片`, {
    fontFamily: UI_FONT, fontSize: '18px', color: '#d4a338', fontStyle: 'bold'
  }).setOrigin(0.5)
  card.add(tag)

  // 🌟 核心修复：用 RenderTexture 强行渲染图片
  const imgW = 380
  const imgH = 380 
  
  const drawImage = () => {
    const imgContainer = scene.add.container(0, imgY)
    
    // 创建一个 380x380 的离屏渲染纹理（相当于一张白纸）
    const rt = scene.add.renderTexture(0, 0, imgW, imgH).setOrigin(0.5)
    
    // 获取原图，算好缩放比例
    const tempImg = scene.add.image(0, 0, cat.imageKey).setVisible(false)
    const scale = Math.max(imgW / tempImg.width, imgH / tempImg.height)
    tempImg.setScale(scale)
    
    // 把缩放后的原图强行画到这张白纸的正中间
    rt.draw(tempImg, imgW / 2, imgH / 2)
    tempImg.destroy() // 画完就销毁原图

    imgContainer.add(rt)

    // 金边相框
    const border = scene.add.graphics()
    border.lineStyle(2, 0xd4a338, 0.8)
    border.strokeRoundedRect(-imgW / 2, -imgH / 2, imgW, imgH, 8)
    imgContainer.add(border)

    card.add(imgContainer)
  }

  if (scene.textures.exists(cat.imageKey)) {
    drawImage()
  } else {
    const placeholder = scene.add.rectangle(0, imgY, imgW, imgH, 0xeeeeee).setStrokeStyle(2, 0xcccccc)
    card.add(placeholder)
    
    scene.load.once(`filecomplete-image-${cat.imageKey}`, () => {
      placeholder.destroy()
      drawImage()
    })
  }

  // 名字
  const nameText = scene.add.text(0, nameY, cat.name, {
    fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f', fontStyle: 'bold'
  }).setOrigin(0.5)
  card.add(nameText)

  // 品种
  const breedText = scene.add.text(0, breedY, cat.breed, {
    fontFamily: UI_FONT, fontSize: '16px', color: '#7d6354'
  }).setOrigin(0.5)
  card.add(breedText)

  // 诗句
  const poemText = scene.add.text(0, poemY, cat.poem, {
    fontFamily: UI_FONT, fontSize: '20px', color: '#8c3b2b', fontStyle: 'italic',
    align: 'center', wordWrap: { width: 380 }
  }).setOrigin(0.5)
  card.add(poemText)

  // 底部印章
  const seal = scene.add.text(0, sealY, '寻脉 · 纪念', {
    fontFamily: UI_FONT, fontSize: '14px', color: '#d4a338',
  }).setOrigin(0.5)
  card.add(seal)

  // 按钮
  const btn = textButton(scene, 0, btnY, '收入图鉴', () => {
    overlay.destroy()
    card.destroy()
  })
  card.add(btn)

  // 入场动画
  card.y = 800
  scene.tweens.add({
    targets: card,
    y: 360,
    duration: 600,
    ease: 'Back.easeOut'
  })
}