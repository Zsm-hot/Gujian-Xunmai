import Phaser from 'phaser';

enum TaskPhase {
    INTRO,
    TASK1_FISH,
    TASK2_CAT,
    TASK3_GOOSE,
    TASK4_WELL,
    COMPLETE
}

interface FishZone {
    x: number;
    y: number;
    target: number;
    current: number;
    rect: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
    isOverfed: boolean;
}

export class ZZScene extends Phaser.Scene {
    private currentPhase: TaskPhase = TaskPhase.INTRO;
    private npc!: Phaser.GameObjects.Container;
    private taskTitle!: Phaser.GameObjects.Text;
    private taskHint!: Phaser.GameObjects.Text;
    
    // Task 1 State
    private fishZones: FishZone[] = [];
    private selectedFood: string | null = null;
    private waterQualityBar!: Phaser.GameObjects.Rectangle;
    private waterQuality = 100;

    // Task 2 State
    private catsFound = 0;
    private totalCats = 3;
    private pawPrints: Phaser.GameObjects.Graphics[] = [];
    private currentPawIndex = 0;

    // Task 3 State
    private gooseSteps = ['brush', 'water', 'comb', 'towel', 'food'];
    private currentGooseStep = 0;
    private gooseTools: Phaser.GameObjects.Container[] = [];

    // Task 4 State
    private wellPhase = 0; // 0: clean, 1: filter, 2: wheel, 3: water
    private trashItems: Phaser.GameObjects.GameObject[] = [];
    private wellTurbidity = 0;

    constructor() {
        super({ key: 'ZZScene' });
    }

    preload() {
        this.generateTextures();
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x2d3748); // Background
        
        // UI Setup
        this.taskTitle = this.add.text(400, 40, '拙政园 - 园丁的挑战', { fontSize: '24px', color: '#fff' }).setOrigin(0.5);
        this.taskHint = this.add.text(400, 80, '', { fontSize: '16px', color: '#cbd5e0', wordWrap: { width: 600 }, align: 'center' }).setOrigin(0.5);

        // NPC Gardener
        this.npc = this.add.container(700, 500);
        const npcBody = this.add.rectangle(0, 0, 40, 60, 0x48bb78);
        const npcHead = this.add.circle(0, -40, 20, 0xfbd38d);
        this.npc.add([npcBody, npcHead]);
        this.add.text(700, 550, '园丁', { fontSize: '14px', color: '#fff' }).setOrigin(0.5);

        this.startIntro();
    }

    private generateTextures() {
        const g = this.add.graphics();
        
        // Foods
        g.clear(); g.fillStyle(0x8b4513); g.fillCircle(15, 15, 15); g.generateTexture('food_fish', 30, 30);
        g.clear(); g.fillStyle(0x808080); g.fillRect(5, 5, 20, 20); g.generateTexture('food_stone', 30, 30);
        g.clear(); g.fillStyle(0xff0000); g.fillTriangle(15, 0, 0, 30, 30, 30); g.generateTexture('food_chili', 30, 30);
        
        // Tools
        g.clear(); g.fillStyle(0xa0aec0); g.fillRect(0, 10, 30, 5); g.fillRect(25, 0, 5, 30); g.generateTexture('tool_brush', 30, 30);
        g.clear(); g.fillStyle(0x4299e1); g.fillRect(5, 10, 20, 20); g.fillRect(10, 0, 10, 10); g.generateTexture('tool_water', 30, 30);
        g.clear(); g.fillStyle(0xed8936); g.fillRect(0, 12, 30, 6); for(let i=0;i<30;i+=6) g.fillRect(i, 0, 2, 30); g.generateTexture('tool_comb', 30, 30);
        g.clear(); g.fillStyle(0xffffff); g.fillRect(0, 0, 30, 30); g.generateTexture('tool_towel', 30, 30);
        
        // Objects
        g.clear(); g.fillStyle(0xedf2f7); g.fillEllipse(25, 25, 50, 40); g.generateTexture('goose', 50, 50);
        g.clear(); g.fillStyle(0x718096); g.fillCircle(25, 25, 25); g.generateTexture('well', 50, 50);
        g.clear(); g.fillStyle(0x4a5568); g.fillRect(0, 0, 40, 10); g.generateTexture('filter', 40, 10);
        g.clear(); g.fillStyle(0x975a16); g.fillCircle(20, 20, 20); g.generateTexture('wheel', 40, 40);
        g.clear(); g.fillStyle(0x4299e1); g.fillRect(5, 10, 20, 20); g.fillRect(10, 0, 10, 10); g.generateTexture('bucket', 30, 30);
        g.clear(); g.fillStyle(0x48bb78); g.fillCircle(15, 15, 15); g.generateTexture('cat', 30, 30);
        g.clear(); g.fillStyle(0xf6e05e); g.fillTriangle(10, 0, 0, 20, 20, 20); g.generateTexture('paw', 20, 20);
        g.clear(); g.fillStyle(0x2d3748); g.fillCircle(10, 10, 10); g.generateTexture('trash', 20, 20);

        g.destroy();
    }

    private startIntro() {
        this.currentPhase = TaskPhase.INTRO;
        this.taskHint.setText('园丁NPC：欢迎来到拙政园！请帮我完成四项照料任务，维护园林生态。');
        this.time.delayedCall(2000, () => this.startTask1());
    }

    // ================= TASK 1: 池畔逐影 =================
    private startTask1() {
        this.currentPhase = TaskPhase.TASK1_FISH;
        this.taskTitle.setText('任务一：池畔逐影（鱼食喂鱼）');
        this.taskHint.setText('选择正确的鱼食，分区定量投喂。注意水质变化！');
        
        this.waterQuality = 100;
        const wqBg = this.add.rectangle(400, 120, 200, 20, 0x4a5568);
        this.waterQualityBar = this.add.rectangle(300, 120, 200, 20, 0x48bb78).setOrigin(0, 0.5);
        this.add.text(400, 100, '水质', { fontSize: '14px', color: '#fff' }).setOrigin(0.5);

        // Zones
        const zoneData = [
            { x: 200, y: 300, target: 3 },
            { x: 400, y: 350, target: 4 },
            { x: 600, y: 300, target: 2 }
        ];

        this.fishZones = zoneData.map(z => {
            const rect = this.add.rectangle(z.x, z.y, 100, 100, 0x3182ce).setInteractive();
            const text = this.add.text(z.x, z.y, `0 / ${z.target}`, { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
            rect.on('pointerdown', () => this.feedFish(z));
            return { ...z, current: 0, rect, text, isOverfed: false };
        });

        // Foods
        const foods = ['food_fish', 'food_stone', 'food_chili'];
        foods.forEach((f, i) => {
            const img = this.add.image(150 + i * 100, 500, f).setInteractive().setScale(1.5);
            img.on('pointerdown', () => this.selectFood(f, img));
        });
    }

    private selectFood(foodKey: string, img: Phaser.GameObjects.Image) {
        if (foodKey === 'food_fish') {
            this.selectedFood = foodKey;
            this.taskHint.setText('已选择合规鱼食，请点击池塘区域投喂。');
            img.setTint(0x00ff00);
        } else {
            this.taskHint.setText('错误食材！已标红退回。');
            img.setTint(0xff0000);
            this.time.delayedCall(500, () => {
                img.clearTint();
            });
        }
    }

    private feedFish(zone: FishZone) {
        if (this.selectedFood !== 'food_fish') {
            this.taskHint.setText('请先选择正确的鱼食！');
            return;
        }
        if (zone.isOverfed) {
            this.taskHint.setText('该区域已过量，请点击"清理"按钮重置。');
            return;
        }

        zone.current++;
        zone.text.setText(`${zone.current} / ${zone.target}`);

        if (zone.current > zone.target) {
            zone.isOverfed = true;
            zone.rect.setFillStyle(0xe53e3e);
            this.waterQuality = Math.max(0, this.waterQuality - 20);
            this.waterQualityBar.width = this.waterQuality * 2;
            this.taskHint.setText('投喂过量！水质下降。请点击区域清理残食。');
            
            zone.rect.once('pointerdown', () => {
                zone.current = 0;
                zone.isOverfed = false;
                zone.rect.setFillStyle(0x3182ce);
                zone.text.setText(`0 / ${zone.target}`);
                this.waterQuality = Math.min(100, this.waterQuality + 20);
                this.waterQualityBar.width = this.waterQuality * 2;
                this.taskHint.setText('残食已清理，请重新投喂。');
            });
        } else if (zone.current === zone.target) {
            zone.rect.setFillStyle(0x48bb78);
            this.checkTask1Complete();
        }
    }

    private checkTask1Complete() {
        if (this.fishZones.every(z => z.current === z.target)) {
            this.taskHint.setText('任务一完成！获得：锦鲤池生态卡');
            this.time.delayedCall(2000, () => this.clearTask1());
        }
    }

    private clearTask1() {
        this.children.removeAll(true);
        this.create(); // Re-init basic UI
        this.startTask2();
    }

    // ================= TASK 2: 巷陌寻踪 =================
    private startTask2() {
        this.currentPhase = TaskPhase.TASK2_CAT;
        this.taskTitle.setText('任务二：巷陌寻踪（寻找流浪猫）');
        this.taskHint.setText('按诗句线索寻找猫咪："雪点印泥香，花阴卧暖阳"。点击地面寻找脚印。');
        this.catsFound = 0;
        this.currentPawIndex = 0;

        // Generate 3 cat hiding spots
        const spots = [
            { x: 200, y: 250 },
            { x: 500, y: 400 },
            { x: 300, y: 450 }
        ];

        spots.forEach((spot, index) => {
            const bush = this.add.circle(spot.x, spot.y, 40, 0x2f855a).setInteractive();
            bush.on('pointerdown', () => this.checkCatSpot(bush, index));
        });

        // Paw prints path (simplified)
        this.add.text(400, 150, '提示：点击灌木丛探索', { fontSize: '16px', color: '#ecc94b' }).setOrigin(0.5);
    }

    private checkCatSpot(bush: Phaser.GameObjects.Arc, index: number) {
        // Simplified logic: any bush has a chance to have a cat, or follow a sequence
        // Here we just make each bush contain a cat for demonstration, but require clicking 3 times
        if (bush.getData('found')) return;

        bush.setFillStyle(0x48bb78);
        const cat = this.add.image(bush.x, bush.y, 'cat').setScale(1.5).setAlpha(0);
        this.tweens.add({ targets: cat, alpha: 1, duration: 500 });
        
        bush.setData('found', true);
        this.catsFound++;
        this.taskHint.setText(`找到一只猫咪！(${this.catsFound}/${this.totalCats})`);

        if (this.catsFound >= this.totalCats) {
            this.taskHint.setText('任务二完成！获得：猫咪图鉴');
            this.time.delayedCall(2000, () => this.clearTask2());
        }
    }

    private clearTask2() {
        this.children.removeAll(true);
        this.create();
        this.startTask3();
    }

    // ================= TASK 3: 水岸清羽 =================
    private startTask3() {
        this.currentPhase = TaskPhase.TASK3_GOOSE;
        this.taskTitle.setText('任务三：水岸清羽（给大鹅洗澡）');
        this.taskHint.setText('按步骤清洁大鹅：1.清理岸边 2.轻淋 3.顺毛 4.擦干 5.安抚投喂');
        this.currentGooseStep = 0;

        // Goose
        const goose = this.add.image(400, 300, 'goose').setScale(3).setInteractive();
        goose.on('pointerdown', () => this.interactGoose());

        // Tools
        const toolKeys = this.gooseSteps.map(s => `tool_${s}`);
        this.gooseTools = [];
        toolKeys.forEach((key, i) => {
            const tool = this.add.image(250 + i * 70, 520, key).setScale(1.5).setInteractive();
            tool.setData('step', i);
            tool.on('pointerdown', () => this.selectGooseTool(tool, i));
            this.gooseTools.push(tool as any);
        });
        
        this.highlightCurrentTool();
    }

    private highlightCurrentTool() {
        this.gooseTools.forEach((t, i) => {
            t.setTint(i === this.currentGooseStep ? 0xffff00 : 0xffffff);
        });
    }

    private selectGooseTool(tool: Phaser.GameObjects.Image, stepIndex: number) {
        if (stepIndex !== this.currentGooseStep) {
            this.taskHint.setText(`步骤错序！当前应进行第 ${this.currentGooseStep + 1} 步。`);
            tool.setTint(0xff0000);
            this.time.delayedCall(300, () => this.highlightCurrentTool());
            return;
        }
        tool.setData('selected', true);
        this.taskHint.setText('工具已选中，请点击大鹅进行操作。');
    }

    private interactGoose() {
        const selectedTool = this.gooseTools.find(t => t.getData('selected'));
        if (!selectedTool) {
            this.taskHint.setText('请先在下方选择正确的工具！');
            return;
        }

        // Special rule: no direct washing head/neck (simplified: just check step)
        this.currentGooseStep++;
        selectedTool.setData('selected', false);
        selectedTool.setAlpha(0.5);
        selectedTool.disableInteractive();

        if (this.currentGooseStep >= this.gooseSteps.length) {
            this.taskHint.setText('任务三完成！获得：水岸照料知识卡');
            this.time.delayedCall(2000, () => this.clearTask3());
        } else {
            this.taskHint.setText(`步骤 ${this.currentGooseStep} 完成！请继续下一步。`);
            this.highlightCurrentTool();
        }
    }

    private clearTask3() {
        this.children.removeAll(true);
        this.create();
        this.startTask4();
    }

    // ================= TASK 4: 天井通渠 =================
    private startTask4() {
        this.currentPhase = TaskPhase.TASK4_WELL;
        this.taskTitle.setText('任务四：天井通渠（清理水井）');
        this.taskHint.setText('阶段1：点击清理井内垃圾');
        this.wellPhase = 0;
        this.wellTurbidity = 0;

        // Well
        this.add.image(400, 300, 'well').setScale(3);
        
        // Trash
        this.trashItems = [];
        for (let i = 0; i < 3; i++) {
            const trash = this.add.image(380 + i * 20, 290 + i * 10, 'trash').setInteractive();
            trash.on('pointerdown', () => this.cleanTrash(trash));
            this.trashItems.push(trash);
        }

        // Filter (hidden initially)
        this.filterImg = this.add.image(600, 300, 'filter').setScale(2).setVisible(false).setInteractive();
        this.filterImg.on('pointerdown', () => this.startDragFilter());

        // Wheel (hidden initially)
        this.wheelImg = this.add.image(400, 150, 'wheel').setScale(2).setVisible(false).setInteractive();
        this.wheelImg.on('pointerdown', () => this.turnWheel());
        this.wheelTurns = 0;

        // Water targets (hidden initially)
        this.waterTargets = [];
        const targets = [
            { x: 200, y: 400, name: '古树' },
            { x: 600, y: 400, name: '兰花' },
            { x: 400, y: 450, name: '水缸' }
        ];
        targets.forEach(t => {
            const rect = this.add.rectangle(t.x, t.y, 60, 60, 0x744210).setVisible(false).setInteractive();
            const text = this.add.text(t.x, t.y, `${t.name}\n0/2`, { fontSize: '14px', color: '#fff', align: 'center' }).setOrigin(0.5).setVisible(false);
            rect.setData({ ...t, current: 0, target: 2 });
            rect.on('pointerdown', () => this.fillWaterTarget(rect, text));
            this.waterTargets.push({ rect, text });
        });

        // Bucket (hidden initially)
        this.bucketImg = this.add.image(200, 200, 'bucket').setScale(1.5).setVisible(false).setInteractive();
        this.bucketImg.on('pointerdown', () => this.startDragBucket());
    }

    private filterImg!: Phaser.GameObjects.Image;
    private wheelImg!: Phaser.GameObjects.Image;
    private bucketImg!: Phaser.GameObjects.Image;
    private waterTargets: { rect: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text }[] = [];
    private wheelTurns = 0;

    private cleanTrash(trash: Phaser.GameObjects.Image) {
        if (this.wellPhase !== 0) return;
        trash.destroy();
        this.trashItems = this.trashItems.filter(t => t !== trash);
        if (this.trashItems.length === 0) {
            this.taskHint.setText('阶段1完成！阶段2：拖拽过滤网到井口');
            this.wellPhase = 1;
            this.filterImg.setVisible(true);
        }
    }

    private startDragFilter() {
        if (this.wellPhase !== 1) return;
        this.input.setDraggable(this.filterImg);
        this.input.on('drag', (pointer: any, gameObject: any, dragX: number, dragY: number) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });
        this.input.on('dragend', (pointer: any, gameObject: any) => {
            if (Phaser.Math.Distance.Between(gameObject.x, gameObject.y, 400, 300) < 50) {
                gameObject.setVisible(false);
                this.taskHint.setText('阶段2完成！阶段3：点击旋转辘轳 (0/5)');
                this.wellPhase = 2;
                this.wheelImg.setVisible(true);
            } else {
                gameObject.x = 600; gameObject.y = 300;
            }
        });
    }

    private turnWheel() {
        if (this.wellPhase !== 2) return;
        this.wheelTurns++;
        this.wheelImg.angle += 72;
        this.taskHint.setText(`阶段3：点击旋转辘轳 (${this.wheelTurns}/5)`);
        if (this.wheelTurns >= 5) {
            this.taskHint.setText('阶段3完成！阶段4：分配水量（点击水桶后拖拽至目标）');
            this.wellPhase = 3;
            this.bucketImg.setVisible(true);
            this.waterTargets.forEach(t => { t.rect.setVisible(true); t.text.setVisible(true); });
        }
    }

    private startDragBucket() {
        if (this.wellPhase !== 3) return;
        this.input.setDraggable(this.bucketImg);
        this.input.on('drag', (pointer: any, gameObject: any, dragX: number, dragY: number) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });
        this.input.on('dragend', (pointer: any, gameObject: any) => {
            // Check if dropped on a target
            let dropped = false;
            this.waterTargets.forEach(t => {
                if (Phaser.Math.Distance.Between(gameObject.x, gameObject.y, t.rect.x, t.rect.y) < 40) {
                    t.rect.emit('pointerdown');
                    dropped = true;
                }
            });
            // Reset bucket position
            gameObject.x = 200; gameObject.y = 200;
        });
    }

    private fillWaterTarget(rect: Phaser.GameObjects.Rectangle, text: Phaser.GameObjects.Text) {
        if (this.wellPhase !== 3) return;
        const data = rect.getData() as any;
        if (data.current < data.target) {
            data.current++;
            rect.setData('current', data.current);
            text.setText(`${data.name}\n${data.current}/${data.target}`);
            
            if (data.current >= data.target) {
                rect.setFillStyle(0x48bb78);
            }
            
            if (this.waterTargets.every(t => (t.rect.getData() as any).current >= (t.rect.getData() as any).target)) {
                this.taskHint.setText('任务四完成！获得：温柔照料隐藏评价');
                this.time.delayedCall(2000, () => this.completeScene());
            }
        }
    }

    private completeScene() {
        this.currentPhase = TaskPhase.COMPLETE;
        this.children.removeAll(true);
        this.add.rectangle(400, 300, 800, 600, 0x2d3748);
        this.add.text(400, 250, '拙政园关卡完成！', { fontSize: '32px', color: '#f6e05e' }).setOrigin(0.5);
        this.add.text(400, 320, '感谢你的悉心照料，园林生态已恢复生机。', { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
        this.add.text(400, 380, '获得奖励：锦鲤池生态卡、猫咪图鉴、水岸照料知识卡、温柔照料隐藏评价', { fontSize: '16px', color: '#68d391', wordWrap: { width: 600 }, align: 'center' }).setOrigin(0.5);
    }
}