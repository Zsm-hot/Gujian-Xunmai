import Phaser from 'phaser'
import { CourtyardScene } from './scenes/CourtyardScene.ts'
import { TitleScene } from './scenes/TitleScene.ts'
import { ZZScene } from './scenes/zzScence.ts'
import { WorldMapScene } from './scenes/WorldMapScene.ts'
import { RidgeBeastScene } from './scenes/RidgeBeastScene.ts'
import { WorldDetailScene } from './scenes/WorldDetailScene.ts'
import { FlowerStreetScene } from './scenes/FlowerStreetScene.ts'
import { CodexScene } from './scenes/CodexScene.ts'
import { IntroScene } from './scenes/IntroScene.ts'
import { GardenCatScene } from './scenes/GardenCatScene.ts'
import { GardenFishScene } from './scenes/GardenFishScene.ts'
import { GardenGooseScene } from './scenes/GardenGooseScene.ts'
import { GardenWellScene } from './scenes/GardenWellScene.ts'
import { WoodTimberScene } from './scenes/WoodTimberScene.ts'
import { WoodDougongScene } from './scenes/WoodDougongScene.ts'
import { WoodStackingScene } from './scenes/WoodStackingScene.ts'
import { WoodLoadScene } from './scenes/WoodLoadScene.ts'
import { EgyptMuralScene } from './scenes/EgyptMuralScene.ts'
import { EgyptSpotScene } from './scenes/EgyptSpotScene.ts'
import { EgyptStealthScene } from './scenes/EgyptStealthScene.ts'
import { EgyptFinalScene } from './scenes/EgyptFinalScene.ts'
import { PetraPathScene } from './scenes/PetraPathScene.ts'
import { PetraCamelScene } from './scenes/PetraCamelScene.ts'
import { PetraCanalScene } from './scenes/PetraCanalScene.ts'
import { PetraWaterScene } from './scenes/PetraWaterScene.ts'
import { DomeWallScene } from './scenes/DomeWallScene.ts'
import { DomeLightScene } from './scenes/DomeLightScene.ts' 
import { DomeColorScene } from './scenes/DomeColorScene.ts' 
import { AngkorGalleryScene } from './scenes/AngkorGalleryScene.ts'
import { AngkorPoolScene } from './scenes/AngkorPoolScene.ts'
import { MachuSpotScene } from './scenes/MachuSpotScene.ts'
import { MachuDefenseScene } from './scenes/MachuDefenseScene.ts'
import { MachuQuarryScene } from './scenes/MachuQuarryScene.ts'
import { MachuLlamaScene } from './scenes/MachuLlamaScene.ts'
import { AngkorBoatScene } from './scenes/AngkorBoatScene.ts'
import { MarketScene } from './scenes/MarketScene.ts'
import { StoryIntroScene } from './scenes/StoryIntroScene.ts'
import { EndingScene } from './scenes/EndingScene.ts'

export function createGame(parent: string | HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: '#d4cfc4',
    antialias: true,
    // 👇 新增：开启全屏模式，自动适应设备尺寸
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720,
      expandParent: true, // 允许画布扩展以填满父容器
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    scene: [
      TitleScene, IntroScene, WorldMapScene, WorldDetailScene, CourtyardScene, 
      RidgeBeastScene, GardenCatScene, GardenFishScene, GardenGooseScene, GardenWellScene, 
      WoodTimberScene, WoodDougongScene, WoodStackingScene, WoodLoadScene, 
      EgyptMuralScene, EgyptSpotScene, EgyptStealthScene, EgyptFinalScene, 
      PetraPathScene, PetraCamelScene, PetraCanalScene, PetraWaterScene, 
      DomeWallScene, DomeLightScene, DomeColorScene, 
      AngkorGalleryScene, AngkorPoolScene, MachuSpotScene, MachuDefenseScene, 
      MachuQuarryScene, MachuLlamaScene, AngkorBoatScene, MarketScene, 
      StoryIntroScene, EndingScene, FlowerStreetScene, CodexScene, ZZScene
    ],
  })
}