import Phaser from 'phaser'
import { UI_FONT, palette } from '../palette.ts'
import { roundedPanel, textButton } from '../ui/panels.ts'
import { CoinSystem } from '../systems/CoinSystem.ts'
import { AudioSystem } from '../systems/AudioSystem.ts'

type ItemType = 'accessory' | 'food'

interface MarketItem {
  id: string
  name: string
  icon: string
  price: number
  type: ItemType
}

const ITEMS: MarketItem[] = [
  { id: 'tassel', name: '流苏发穗', icon: '🎀', price: 25, type: 'accessory' },
  { id: 'camellia', name: '山茶花', icon: '🌺', price: 20, type: 'accessory' },
  { id: 'osmanthus', name: '桂花', icon: '🌼', price: 20, type: 'accessory' },
  { id: 'begonia', name: '小海棠', icon: '🌸', price: 20, type: 'accessory' },
  { id: 'fan', name: '蒲扇小折扇', icon: '🪭', price: 30, type: 'accessory' },
  { id: 'jade_chain', name: '青玉石珠链', icon: '📿', price: 45, type: 'accessory' },
  { id: 'yingluo', name: '璎珞小颈圈', icon: '💠', price: 40, type: 'accessory' },
  { id: 'bodhi', name: '木质菩提串', icon: '🪵', price: 40, type: 'accessory' },
  { id: 'bell', name: '锦鲤小铃铛', icon: '🔔', price: 30, type: 'accessory' },
  { id: 'ruby_collar', name: '红宝石项圈', icon: '💎', price: 50, type: 'accessory' },
  { id: 'lotus_lantern', name: '荷花灯', icon: '🏮', price: 40, type: 'accessory' },
  { id: 'paper', name: '一卷素笺', icon: '📜', price: 25, type: 'accessory' },
  { id: 'osmanthus_cake', name: '桂花糕', icon: '🍰', price: 20, type: 'accessory' },
  { id: 'brush', name: '毛笔', icon: '🖌️', price: 20, type: 'accessory' },
  { id: 'window_silhouette', name: '窗棂剪影', icon: '🪟', price: 55, type: 'accessory' },
  { id: 'cloud_silk', name: '云纹底帛', icon: '☁️', price: 50, type: 'accessory' },
  { id: 'stone', name: '山水石摆件', icon: '🗻', price: 50, type: 'accessory' },
  { id: 'milk_cake', name: '奶糕', icon: '🍮', price: 10, type: 'food' },
  { id: 'lotus_soup', name: '莲子羹', icon: '🥣', price: 15, type: 'food' },
  { id: 'dried_fish', name: '皇家小鱼干', icon: '🐟', price: 10, type: 'food' },
  { id: 'qianshi', name: '芡实小团', icon: '🍡', price: 10, type: 'food' },
  { id: 'silver_fish', name: '银鱼酥', icon: '🍤', price: 20, type: 'food' },
  { id: 'crab_cake', name: '蟹粉蒸糕', icon: '🦀', price: 25, type: 'food' },
  { id: 'jasmine', name: '茉莉奶冻', icon: '🍧', price: 30, type: 'food' },
  { id: 'cloud_cake', name: '云片糕', icon: '🥮', price: 35, type: 'food' },
]

const CATEGORIES = [
  { title: '配 饰 篇', filter: (item: MarketItem) => ['tassel', 'camellia', 'osmanthus', 'begonia', 'fan'].includes(item.id) },
  { title: '颈 饰 篇', filter: (item: MarketItem) => ['jade_chain', 'yingluo', 'bodhi', 'bell', 'ruby_collar'].includes(item.id) },
  { title: '抱 物 篇', filter: (item: MarketItem) => ['lotus_lantern', 'paper', 'osmanthus_cake', 'brush'].includes(item.id) },
  { title: '衬 件 篇', filter: (item: MarketItem) => ['window_silhouette', 'cloud_silk', 'stone'].includes(item.id) },
  { title: '美 食 篇', filter: (item: MarketItem) => item.type === 'food' }
]

const MOCK_GALLERY_DATA = [
  { id: 1, author: '阿筑的小迷弟', catName: '玄狸', catEmoji: '🐈', accessory: '🎀', likes: 23, comments: ['太可爱了吧！', '大户人家！'] },
  { id: 2, author: '寻脉者007', catName: '橘猫', catEmoji: '🐈', accessory: '🪭', likes: 15, comments: ['这把扇子绝了'] },
  { id: 3, author: '古建狂热粉', catName: '暹罗', catEmoji: '🐈', accessory: '📿', likes: 42, comments: ['很有禅意', '求搭配教程'] },
]

export class MarketScene extends Phaser.Scene {
  private currentCategoryIndex = 0
  private contentContainer!: Phaser.GameObjects.Container
  private pageText!: Phaser.GameObjects.Text
  private coinText!: Phaser.GameObjects.Text
  
  private isBagOpen = false
  private bagContainer!: Phaser.GameObjects.Container

  private isGalleryOpen = false
  private galleryContainer!: Phaser.GameObjects.Container

  constructor() {
    super('MarketScene')
  }

  create() {
    this.isBagOpen = false
    this.isGalleryOpen = false
    this.currentCategoryIndex = 0
    
    this.add.rectangle(640, 360, 1280, 720, 0xede4d3)

    // 顶部标题
    this.add.text(640, 45, '· 云 笺 坊 集 ·', {
      fontFamily: UI_FONT, fontSize: '32px', color: '#4a453f', fontStyle: 'bold'
    }).setOrigin(0.5)

    // 右上角金币
    const panelCenterX = 1080
    roundedPanel(this, panelCenterX - 100, 20, 200, 50, palette.panel)
    this.add.text(panelCenterX - 75, 45, '🪙', { fontSize: '24px' }).setOrigin(0.5)
    this.coinText = this.add.text(panelCenterX + 10, 45, `囊中金币：${CoinSystem.getCoins()}`, {
      fontFamily: UI_FONT, fontSize: '18px', color: '#8a5a24', fontStyle: 'bold'
    }).setOrigin(0.5)

    // 左上角只保留干净的“重返舆图”
    textButton(this, 130, 45, '← 重返舆图', () => {
      this.scene.start('WorldMapScene')
    })

    // 🌟 把功能按钮移到右下角，并排摆放
    textButton(this, 920, 660, '🎒 舱笺囊', () => {
      this.toggleBag()
    })
    
    textButton(this, 1100, 660, '🖼️ 同游录', () => {
      this.toggleGallery()
    })

    // 翻页导航
    const navY = 120
    textButton(this, 340, navY, '← 翻页', () => this.changePage(-1))
    this.pageText = this.add.text(640, navY, '', {
      fontFamily: UI_FONT, fontSize: '28px', color: '#8c3b2b', fontStyle: 'bold'
    }).setOrigin(0.5)
    textButton(this, 940, navY, '翻页 →', () => this.changePage(1))

    this.contentContainer = this.add.container(0, 0)
    this.bagContainer = this.add.container(0, 0).setDepth(5000).setVisible(false)
    this.galleryContainer = this.add.container(0, 0).setDepth(5000).setVisible(false)

    this.renderPage()
  }

  private changePage(dir: number) {
    if (this.isBagOpen || this.isGalleryOpen) return
    this.currentCategoryIndex += dir
    if (this.currentCategoryIndex < 0) this.currentCategoryIndex = CATEGORIES.length - 1
    else if (this.currentCategoryIndex >= CATEGORIES.length) this.currentCategoryIndex = 0
    this.renderPage()
  }

  private renderPage() {
    this.contentContainer.removeAll(true)
    const category = CATEGORIES[this.currentCategoryIndex]
    this.pageText.setText(`· ${category.title} ·`)

    const items = ITEMS.filter(category.filter)

    items.forEach((item, index) => {
      const totalItems = items.length
      const startX = 640 - ((totalItems - 1) * 150) / 2
      const x = startX + index * 150
      const y = 360

      const card = this.add.container(x, y)
      const bg = roundedPanel(this, -65, -110, 130, 220, palette.paper)
      if (item.type === 'food') {
        bg.lineStyle(2, 0xd4a338, 0.8)
        bg.strokeRoundedRect(-65, -110, 130, 220, 10)
      }
      card.add(bg)

      card.add(this.add.text(0, -50, item.icon, { fontSize: '56px' }).setOrigin(0.5))
      card.add(this.add.text(0, 30, item.name, { fontFamily: UI_FONT, fontSize: '16px', color: '#4a453f', fontStyle: 'bold' }).setOrigin(0.5))
      card.add(this.add.text(0, 60, `🪙 ${item.price}`, { fontFamily: UI_FONT, fontSize: '15px', color: '#8a5a24' }).setOrigin(0.5))

      const btnColor = item.type === 'food' ? 0xd4a338 : 0x8c3b2b
      const btn = this.add.rectangle(0, 90, 100, 30, btnColor).setInteractive({ useHandCursor: true })
      const txt = this.add.text(0, 90, item.type === 'food' ? '投 喂' : '购 入', {
        fontFamily: UI_FONT, fontSize: '14px', color: '#ffffff'
      }).setOrigin(0.5)

      btn.on('pointerdown', () => {
        AudioSystem.playSFX('click')
        this.handlePurchase(item)
      })

      card.add([btn, txt])
      this.contentContainer.add(card)
    })
  }

  private handlePurchase(item: MarketItem) {
    if (CoinSystem.spendCoins(item.price)) {
      AudioSystem.playSFX('coin')
      this.showToast(`成功消费 🪙 ${item.price}`)
      this.coinText.setText(`囊中金币：${CoinSystem.getCoins()}`)
      
      const inventory = JSON.parse(localStorage.getItem('gujian-xunmai:inventory') || '[]')
      if (item.type === 'accessory' && !inventory.includes(item.id)) {
        inventory.push(item.id)
        localStorage.setItem('gujian-xunmai:inventory', JSON.stringify(inventory))
      }
    } else {
      AudioSystem.playSFX('error')
      this.showToast('囊中羞涩，金币不足！')
    }
  }

  private toggleGallery() {
    this.isGalleryOpen = !this.isGalleryOpen
    if (this.isGalleryOpen) {
      this.renderGallery()
      this.galleryContainer.setVisible(true)
    } else {
      this.galleryContainer.setVisible(false)
      this.galleryContainer.removeAll(true)
    }
  }

  private renderGallery() {
    this.galleryContainer.removeAll(true)

    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85).setInteractive()
    overlay.on('pointerdown', () => this.toggleGallery())
    this.galleryContainer.add(overlay)

    const panel = roundedPanel(this, 100, 60, 1080, 600, palette.paper)
    this.galleryContainer.add(panel)

    const title = this.add.text(640, 100, '· 同 游 录 ·', {
      fontFamily: UI_FONT, fontSize: '28px', color: '#8c3b2b', fontStyle: 'bold'
    }).setOrigin(0.5)
    this.galleryContainer.add(title)
    
    const subTitle = this.add.text(640, 135, '展示你精心装扮的猫猫，与其他寻脉者分享吧！', {
      fontFamily: UI_FONT, fontSize: '14px', color: '#8a7354'
    }).setOrigin(0.5)
    this.galleryContainer.add(subTitle)

    const postBtn = textButton(this, 950, 110, '发布我的小猫', () => {
      AudioSystem.playSFX('success')
      this.showToast('发布成功！(测试版已存在本地)')
    })
    this.galleryContainer.add(postBtn)

    MOCK_GALLERY_DATA.forEach((data, index) => {
      const col = index % 3
      const x = 260 + col * 360
      const y = 320

      const card = this.add.container(x, y)
      const bg = roundedPanel(this, -150, -140, 300, 280, 0xffffff)
      card.add(bg)

      card.add(this.add.text(0, -110, `@${data.author}`, { fontFamily: UI_FONT, fontSize: '14px', color: '#888' }).setOrigin(0.5))

      const catBg = this.add.graphics()
      catBg.fillStyle(0xf3e8cf, 1)
      catBg.fillRoundedRect(-120, -80, 240, 120, 8)
      card.add(catBg)
      
      card.add(this.add.text(0, -30, data.catEmoji, { fontSize: '60px' }).setOrigin(0.5))
      card.add(this.add.text(40, -50, data.accessory, { fontSize: '30px' }).setOrigin(0.5))

      card.add(this.add.text(0, 70, `${data.catName}`, { fontFamily: UI_FONT, fontSize: '18px', color: '#4a453f', fontStyle: 'bold' }).setOrigin(0.5))

      const likeBtn = this.add.text(-40, 110, `❤️ ${data.likes}`, { fontFamily: UI_FONT, fontSize: '16px', color: '#d04848' }).setOrigin(0.5)
      likeBtn.setInteractive({ useHandCursor: true })
      likeBtn.on('pointerdown', () => {
        AudioSystem.playSFX('click')
        data.likes++
        likeBtn.setText(`❤️ ${data.likes}`)
      })
      card.add(likeBtn)

      const commentBtn = this.add.text(50, 110, `💬 ${data.comments.length}`, { fontFamily: UI_FONT, fontSize: '16px', color: '#4a90e2' }).setOrigin(0.5)
      commentBtn.setInteractive({ useHandCursor: true })
      commentBtn.on('pointerdown', () => {
        AudioSystem.playSFX('click')
        this.showToast(`评论功能开发中！(目前有${data.comments.length}条)`)
      })
      card.add(commentBtn)

      this.galleryContainer.add(card)
    })

    const closeBtn = textButton(this, 640, 600, '关闭画廊', () => this.toggleGallery())
    this.galleryContainer.add(closeBtn)
  }

  private toggleBag() {
    this.isBagOpen = !this.isBagOpen
    if (this.isBagOpen) {
      this.renderBag()
      this.bagContainer.setVisible(true)
    } else {
      this.bagContainer.setVisible(false)
      this.bagContainer.removeAll(true)
    }
  }

  private renderBag() {
    this.bagContainer.removeAll(true)
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8).setInteractive()
    overlay.on('pointerdown', () => this.toggleBag())
    this.bagContainer.add(overlay)
    const panel = roundedPanel(this, 240, 100, 800, 520, palette.paper)
    this.bagContainer.add(panel)
    const title = this.add.text(640, 140, '· 舱 笺 囊 ·', { fontFamily: UI_FONT, fontSize: '28px', color: '#8c3b2b', fontStyle: 'bold' }).setOrigin(0.5)
    this.bagContainer.add(title)

    const inventory = JSON.parse(localStorage.getItem('gujian-xunmai:inventory') || '[]')
    const ownedItems = ITEMS.filter(item => inventory.includes(item.id))

    if (ownedItems.length === 0) {
      this.bagContainer.add(this.add.text(640, 360, '行囊空空，去集市挑几件心仪的物件吧~', { fontFamily: UI_FONT, fontSize: '20px', color: '#8a7354' }).setOrigin(0.5))
    } else {
      ownedItems.forEach((item, index) => {
        const col = index % 5
        const row = Math.floor(index / 5)
        const x = 320 + col * 140
        const y = 240 + row * 160
        const bg = roundedPanel(this, x - 50, y - 60, 100, 120, 0xffffff)
        this.bagContainer.add(bg)
        this.bagContainer.add(this.add.text(x, y - 20, item.icon, { fontSize: '40px' }).setOrigin(0.5))
        this.bagContainer.add(this.add.text(x, y + 30, item.name, { fontFamily: UI_FONT, fontSize: '14px', color: '#4a453f' }).setOrigin(0.5))
      })
    }
    textButton(this, 640, 580, '合上囊袋', () => this.toggleBag()).setDepth(5001)
  }

  private showToast(msg: string) {
    const t = this.add.text(640, 200, msg, {
      fontFamily: UI_FONT, fontSize: '20px', color: '#ffffff', backgroundColor: '#4a453fcc', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(99999).setAlpha(0)
    this.tweens.add({ targets: t, alpha: 1, y: 150, duration: 300, yoyo: true, hold: 1500, onComplete: () => t.destroy() })
  }
}