import Phaser from 'phaser'

const TaskPhase = {
    INTRO: 0,
    TASK1_FISH: 1,
    TASK2_CAT: 2,
    TASK3_GOOSE: 3,
    TASK4_WELL: 4,
    COMPLETE: 5
} as const;
type TaskPhaseType = typeof TaskPhase[keyof typeof TaskPhase];

interface FishZone {
    x: number
    y: number
    target: number
    current: number
    rect: Phaser.GameObjects.Rectangle
    text: Phaser.GameObjects.Text
    isOverfed: boolean
}

export class ZZScene extends Phaser.Scene {
    private currentPhase: TaskPhaseType = TaskPhase.INTRO
    private npc!: Phaser.GameObjects.Container
    private taskTitle!: Phaser.GameObjects.Text
    private taskHint!: Phaser.GameObjects.Text
    private taskGroup: Phaser.GameObjects.Group | null = null 

    private fishZones: FishZone[] = []
    private selectedFood: string | null = null
    private waterQualityBar!: Phaser.GameObjects.Rectangle
    private waterQuality = 100

    private catsFound = 0
    private totalCats = 3

    private gooseSteps = ['brush', 'water', 'comb', 'towel', 'food']
    private currentGooseStep = 0
    private gooseTools: Phaser.GameObjects.Image[] = []

    private wellPhase = 0 
    private trashItems: Phaser.GameObjects.Image[] = []
    private filterImg!: Phaser.GameObjects.Image
    private wheelImg!: Phaser.GameObjects.Image
    private bucketImg!: Phaser.GameObjects.Image
    private waterTargets: { rect: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text }[] = []
    private wheelTurns = 0

    constructor() {
        super({ key: 'ZZScene' })
    }

    preload() {
        this.generateTextures()
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x2d3748)
        
        this.taskTitle = this.add.text(640, 60, '拙政园 - 园丁的挑战', { fontFamily: 'sans-serif', fontSize: '32px', color: '#fff' }).setOrigin(0.5)
        this.taskHint = this.add.text(640, 120, '', { fontFamily: 'sans-serif', fontSize: '20px', color: '#cbd5e0', wordWrap: { width: 800 }, align: 'center' }).setOrigin(0.5)

        this.npc = this.add.container(1100, 600)
        const npcBody = this.add.rectangle(0, 0, 40, 60, 0x48bb78)
        const npcHead = this.add.circle(0, -40, 20, 0xfbd38d)
        this.npc.add([npcBody, npcHead])
        this.add.text(1100, 660, '园丁', { fontFamily: 'sans-serif', fontSize: '18px', color: '#fff' }).setOrigin(0.5)

        this.taskGroup = this.add.group()

        this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: any, dragX: number, dragY: number) => {
            gameObject.x = dragX
            gameObject.y = dragY
        })

        this.input.on('dragend', (_pointer: Phaser.Input.Pointer, gameObject: any) => {
            if (this.currentPhase === TaskPhase.TASK4_WELL && this.wellPhase === 1 && gameObject === this.filterImg) {
                if (Phaser.Math.Distance.Between(gameObject.x, gameObject.y, 640, 360) < 60) {
                    gameObject.setVisible(false)
                    this.taskHint.setText('阶段2完成！阶段3：点击旋转辘轳 (0/5)')
                    this.wellPhase = 2
                    this.wheelImg.setVisible(true)
                } else {
                    gameObject.x = 900; gameObject.y = 360
                }
            } else if (this.currentPhase === TaskPhase.TASK4_WELL && this.wellPhase === 3 && gameObject === this.bucketImg) {
                this.waterTargets.forEach(t => {
                    if (Phaser.Math.Distance.Between(gameObject.x, gameObject.y, t.rect.x, t.rect.y) < 50) {
                        t.rect.emit('pointerdown')
                    }
                })
                gameObject.x = 300; gameObject.y = 200
            }
        })

        this.startIntro()
    }

    private generateTextures() {
        const g = this.add.graphics()
        
        g.clear(); g.fillStyle(0x8b4513); g.fillCircle(15, 15, 15); g.generateTexture('food_fish', 30, 30)
        g.clear(); g.fillStyle(0x808080); g.fillRect(5, 5, 20, 20); g.generateTexture('food_stone', 30, 30)
        g.clear(); g.fillStyle(0xff0000); g.fillTriangle(15, 0, 0, 30, 30, 30); g.generateTexture('food_chili', 30, 30)
        
        g.clear(); g.fillStyle(0xa0aec0); g.fillRect(0, 10, 30, 5); g.fillRect(25, 0, 5, 30); g.generateTexture('tool_brush', 30, 30)
        g.clear(); g.fillStyle(0x4299e1); g.fillRect(5, 10, 20, 20); g.fillRect(10, 0, 10, 10); g.generateTexture('tool_water', 30, 30)
        g.clear(); g.fillStyle(0xed8936); g.fillRect(0, 12, 30, 6); for(let i=0;i<30;i+=6) g.fillRect(i, 0, 2, 30); g.generateTexture('tool_comb', 30, 30)
        g.clear(); g.fillStyle(0xffffff); g.fillRect(0, 0, 30, 30); g.generateTexture('tool_towel', 30, 30)
        g.clear(); g.fillStyle(0xf6e05e); g.fillCircle(15, 15, 15); g.generateTexture('tool_food', 30, 30)
        
        g.clear(); g.fillStyle(0xedf2f7); g.fillEllipse(25, 25, 50, 40); g.generateTexture('goose', 50, 50)
        g.clear(); g.fillStyle(0x718096); g.fillCircle(25, 25, 25); g.generateTexture('well', 50, 50)
        g.clear(); g.fillStyle(0x4a5568); g.fillRect(0, 0, 40, 10); g.generateTexture('filter', 40, 10)
        g.clear(); g.fillStyle(0x975a16); g.fillCircle(20, 20, 20); g.generateTexture('wheel', 40, 40)
        g.clear(); g.fillStyle(0x4299e1); g.fillRect(5, 10, 20, 20); g.fillRect(10, 0, 10, 10); g.generateTexture('bucket', 30, 30)
        g.clear(); g.fillStyle(0x48bb78); g.fillCircle(15, 15, 15); g.generateTexture('cat', 30, 30)
        g.clear(); g.fillStyle(0x2d3748); g.fillCircle(10, 10, 10); g.generateTexture('trash', 20, 20)

        g.destroy()
    }

    private clearCurrentTask() {
        if (this.taskGroup) {
            this.taskGroup.clear(true, true)
        }
        this.taskGroup = this.add.group()
        this.fishZones = []
        this.gooseTools = []
        this.trashItems = []
        this.waterTargets = []
    }

    private startIntro() {
        this.currentPhase = TaskPhase.INTRO
        this.taskHint.setText('园丁NPC：欢迎来到拙政园！请帮我完成四项照料任务，维护园林生态。')
        this.time.delayedCall(2000, () => this.startTask1())
    }

    private startTask1() {
        this.clearCurrentTask()
        this.currentPhase = TaskPhase.TASK1_FISH
        this.taskTitle.setText('任务一：池畔逐影（鱼食喂鱼）')
        this.taskHint.setText('选择正确的鱼食，分区定量投喂。注意水质变化！')
        
        this.waterQuality = 100
        const wqBg = this.add.rectangle(640, 180, 300, 20, 0x4a5568)
        this.waterQualityBar = this.add.rectangle(490, 180, 300, 20, 0x48bb78).setOrigin(0, 0.5)
        const wqText = this.add.text(640, 150, '水质', { fontFamily: 'sans-serif', fontSize: '18px', color: '#fff' }).setOrigin(0.5)
        this.taskGroup?.addMultiple([wqBg, this.waterQualityBar, wqText])

        const zoneData = [
            { x: 350, y: 350, target: 3 },
            { x: 640, y: 400, target: 4 },
            { x: 930, y: 350, target: 2 }
        ]

        this.fishZones = zoneData.map(z => {
            const rect = this.add.rectangle(z.x, z.y, 120, 120, 0x3182ce).setInteractive({ useHandCursor: true })
            const text = this.add.text(z.x, z.y, `0 / ${z.target}`, { fontFamily: 'sans-serif', fontSize: '22px', color: '#fff' }).setOrigin(0.5)
            rect.on('pointerdown', () => this.feedFish(z))
            this.taskGroup?.addMultiple([rect, text])
            return { ...z, current: 0, rect, text, isOverfed: false }
        })

        const foods = ['food_fish', 'food_stone', 'food_chili']
        foods.forEach((f, i) => {
            const img = this.add.image(300 + i * 150, 600, f).setInteractive({ useHandCursor: true }).setScale(2)
            img.on('pointerdown', () => this.selectFood(f, img))
            this.taskGroup?.add(img)
        })
    }

    private selectFood(foodKey: string, img: Phaser.GameObjects.Image) {
        if (foodKey === 'food_fish') {
            this.selectedFood = foodKey
            this.taskHint.setText('已选择合规鱼食，请点击池塘区域投喂。')
            img.setTint(0x00ff00)
        } else {
            this.taskHint.setText('错误食材！已标红退回。')
            img.setTint(0xff0000)
            this.time.delayedCall(500, () => img.clearTint())
        }
    }

    private feedFish(z: { x: number, y: number, target: number }) {
        const zone = this.fishZones.find(fz => fz.x === z.x && fz.y === z.y)
        if (!zone) return

        if (this.selectedFood !== 'food_fish') {
            this.taskHint.setText('请先选择正确的鱼食！')
            return
        }
        if (zone.isOverfed) {
            this.taskHint.setText('该区域已过量，请点击红色区域清理。')
            return
        }

        zone.current++
        zone.text.setText(`${zone.current} / ${zone.target}`)

        if (zone.current > zone.target) {
            zone.isOverfed = true
            zone.rect.setFillStyle(0xe53e3e)
            this.waterQuality = Math.max(0, this.waterQuality - 20)
            this.waterQualityBar.width = this.waterQuality * 3
            this.taskHint.setText('投喂过量！水质下降。请点击区域清理残食。')
            
            zone.rect.once('pointerdown', () => {
                zone.current = 0
                zone.isOverfed = false
                zone.rect.setFillStyle(0x3182ce)
                zone.text.setText(`0 / ${zone.target}`)
                this.waterQuality = Math.min(100, this.waterQuality + 20)
                this.waterQualityBar.width = this.waterQuality * 3
                this.taskHint.setText('残食已清理，请重新投喂。')
            })
        } else if (zone.current === zone.target) {
            zone.rect.setFillStyle(0x48bb78)
            this.checkTask1Complete()
        }
    }

    private checkTask1Complete() {
        if (this.fishZones.every(z => z.current === z.target)) {
            this.taskHint.setText('任务一完成！获得：锦鲤池生态卡')
            this.time.delayedCall(2000, () => this.startTask2())
        }
    }

    private startTask2() {
        this.clearCurrentTask()
        this.currentPhase = TaskPhase.TASK2_CAT
        this.taskTitle.setText('任务二：巷陌寻踪（寻找流浪猫）')
        this.taskHint.setText('按诗句线索寻找猫咪："雪点印泥香，花阴卧暖阳"。点击灌木丛探索。')
        this.catsFound = 0

        const spots = [
            { x: 300, y: 300 }, { x: 800, y: 450 }, { x: 500, y: 550 }
        ]

        spots.forEach((spot) => {
            const bush = this.add.circle(spot.x, spot.y, 50, 0x2f855a).setInteractive({ useHandCursor: true })
            bush.on('pointerdown', () => this.checkCatSpot(bush))
            this.taskGroup?.add(bush)
        })

        const hintText = this.add.text(640, 200, '提示：点击绿色灌木丛探索', { fontFamily: 'sans-serif', fontSize: '20px', color: '#ecc94b' }).setOrigin(0.5)
        this.taskGroup?.add(hintText)
    }

    private checkCatSpot(bush: Phaser.GameObjects.Arc) {
        if (bush.getData('found')) return

        bush.setFillStyle(0x48bb78)
        const cat = this.add.image(bush.x, bush.y, 'cat').setScale(2).setAlpha(0)
        this.taskGroup?.add(cat)
        this.tweens.add({ targets: cat, alpha: 1, duration: 500 })
        
        bush.setData('found', true)
        this.catsFound++
        this.taskHint.setText(`找到一只猫咪！(${this.catsFound}/${this.totalCats})`)

        if (this.catsFound >= this.totalCats) {
            this.taskHint.setText('任务二完成！获得：猫咪图鉴')
            this.time.delayedCall(2000, () => this.startTask3())
        }
    }

    private startTask3() {
        this.clearCurrentTask()
        this.currentPhase = TaskPhase.TASK3_GOOSE
        this.taskTitle.setText('任务三：水岸清羽（给大鹅洗澡）')
        this.taskHint.setText('按步骤清洁大鹅：1.清理岸边 2.轻淋 3.顺毛 4.擦干 5.安抚投喂')
        this.currentGooseStep = 0

        const goose = this.add.image(640, 350, 'goose').setScale(4).setInteractive({ useHandCursor: true })
        goose.on('pointerdown', () => this.interactGoose())
        this.taskGroup?.add(goose)

        const toolKeys = this.gooseSteps.map(s => `tool_${s}`)
        this.gooseTools = []
        toolKeys.forEach((key, i) => {
            const tool = this.add.image(400 + i * 120, 600, key).setScale(2).setInteractive({ useHandCursor: true })
            tool.setData('step', i)
            tool.on('pointerdown', () => this.selectGooseTool(tool, i))
            this.gooseTools.push(tool)
            this.taskGroup?.add(tool)
        })
        
        this.highlightCurrentTool()
    }

    private highlightCurrentTool() {
        this.gooseTools.forEach((t, i) => {
            t.setTint(i === this.currentGooseStep ? 0xffff00 : 0xffffff)
        })
    }

    private selectGooseTool(tool: Phaser.GameObjects.Image, stepIndex: number) {
        if (stepIndex !== this.currentGooseStep) {
            this.taskHint.setText(`步骤错序！当前应进行第 ${this.currentGooseStep + 1} 步。`)
            tool.setTint(0xff0000)
            this.time.delayedCall(300, () => this.highlightCurrentTool())
            return
        }
        this.gooseTools.forEach(t => t.setData('selected', false))
        tool.setData('selected', true)
        this.taskHint.setText('工具已选中，请点击大鹅进行操作。')
    }

    private interactGoose() {
        const selectedTool = this.gooseTools.find(t => t.getData('selected'))
        if (!selectedTool) {
            this.taskHint.setText('请先在下方选择正确的工具！')
            return
        }

        this.currentGooseStep++
        selectedTool.setData('selected', false)
        selectedTool.setAlpha(0.3)
        selectedTool.disableInteractive()

        if (this.currentGooseStep >= this.gooseSteps.length) {
            this.taskHint.setText('任务三完成！获得：水岸照料知识卡')
            this.time.delayedCall(2000, () => this.startTask4())
        } else {
            this.taskHint.setText(`步骤 ${this.currentGooseStep} 完成！请继续下一步。`)
            this.highlightCurrentTool()
        }
    }

    private startTask4() {
        this.clearCurrentTask()
        this.currentPhase = TaskPhase.TASK4_WELL
        this.taskTitle.setText('任务四：天井通渠（清理水井）')
        this.taskHint.setText('阶段1：点击清理井内垃圾')
        this.wellPhase = 0

        const well = this.add.image(640, 350, 'well').setScale(4)
        this.taskGroup?.add(well)
        
        for (let i = 0; i < 3; i++) {
            const trash = this.add.image(620 + i * 20, 340 + i * 15, 'trash').setInteractive({ useHandCursor: true })
            trash.on('pointerdown', () => this.cleanTrash(trash))
            this.trashItems.push(trash)
            this.taskGroup?.add(trash)
        }

        this.filterImg = this.add.image(900, 350, 'filter').setScale(3).setVisible(false).setInteractive({ useHandCursor: true })
        this.taskGroup?.add(this.filterImg)

        this.wheelImg = this.add.image(640, 150, 'wheel').setScale(3).setVisible(false).setInteractive({ useHandCursor: true })
        this.wheelImg.on('pointerdown', () => this.turnWheel())
        this.taskGroup?.add(this.wheelImg)

        const targets = [
            { x: 300, y: 500, name: '古树' },
            { x: 980, y: 500, name: '兰花' },
            { x: 640, y: 550, name: '水缸' }
        ]
        targets.forEach(t => {
            const rect = this.add.rectangle(t.x, t.y, 80, 80, 0x744210).setVisible(false).setInteractive({ useHandCursor: true })
            const text = this.add.text(t.x, t.y, `${t.name}\n0/2`, { fontFamily: 'sans-serif', fontSize: '16px', color: '#fff', align: 'center' }).setOrigin(0.5).setVisible(false)
            rect.setData({ ...t, current: 0, target: 2 })
            rect.on('pointerdown', () => this.fillWaterTarget(rect, text))
            this.waterTargets.push({ rect, text })
            this.taskGroup?.addMultiple([rect, text])
        })

        this.bucketImg = this.add.image(300, 200, 'bucket').setScale(2).setVisible(false).setInteractive({ useHandCursor: true })
        this.taskGroup?.add(this.bucketImg)
    }

    private cleanTrash(trash: Phaser.GameObjects.Image) {
        if (this.wellPhase !== 0) return
        trash.destroy()
        this.trashItems = this.trashItems.filter(t => t !== trash)
        if (this.trashItems.length === 0) {
            this.taskHint.setText('阶段1完成！阶段2：拖拽过滤网到井口')
            this.wellPhase = 1
            this.filterImg.setVisible(true)
            this.input.setDraggable(this.filterImg)
        }
    }

    private turnWheel() {
        if (this.wellPhase !== 2) return
        this.wheelTurns++
        this.wheelImg.angle += 72
        this.taskHint.setText(`阶段3：点击旋转辘轳 (${this.wheelTurns}/5)`)
        if (this.wheelTurns >= 5) {
            this.taskHint.setText('阶段3完成！阶段4：拖拽水桶至发光区域分配水量')
            this.wellPhase = 3
            this.bucketImg.setVisible(true)
            this.waterTargets.forEach(t => { t.rect.setVisible(true); t.text.setVisible(true); })
            this.input.setDraggable(this.bucketImg)
        }
    }

    private fillWaterTarget(rect: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text) {
        if (this.wellPhase !== 3) return
        
        const data: any = rect.getData()
        if (!data || data.current === undefined) return

        if (data.current < data.target) {
            data.current++
            rect.setData('current', data.current)
            
            // 🌟 终极降维：不用模板字符串，用简单的 + 拼接，TS 绝对不报错
            const str = data.name + '\n' + data.current + '/' + data.target
            text.setText(str)
            
            if (data.current >= data.target) {
                rect.setFillStyle(0x48bb78)
            }
            
            let allFilled = true
            for (let i = 0; i < this.waterTargets.length; i++) {
                const t = this.waterTargets[i]
                const tData: any = t.rect.getData()
                if (!tData || tData.current < tData.target) {
                    allFilled = false
                    break
                }
            }
            
            if (allFilled) {
                this.completeScene()
            }
        }
    }

    private completeScene() {
        this.clearCurrentTask()
        this.currentPhase = TaskPhase.COMPLETE
        this.taskTitle.setText('拙政园关卡完成！')
        this.taskHint.setText('感谢你的悉心照料，园林生态已恢复生机。')
        
        // 🌟 终极降维：把内容提出来，保证 add.text 参数绝对正确
        const rewardMsg = '获得奖励：\n锦鲤池生态卡、猫咪图鉴、水岸照料知识卡、温柔照料隐藏评价'
        const styleConfig = { fontFamily: 'sans-serif', fontSize: '24px', color: '#68d391', wordWrap: { width: 800 }, align: 'center' }
        
        const winText = this.add.text(640, 360, rewardMsg, styleConfig).setOrigin(0.5)
        this.taskGroup?.add(winText)
    }
}