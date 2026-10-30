import type { WorldEntry } from '../types.ts'

/** 八方营造录 · 八大世界 */
export const worlds: WorldEntry[] = [
  {
    id: 'forbidden-city',
    name: '故宫',
    status: 'playable',
    levels: [
      { id: 'forbidden-city-hall', title: '故宫拾遗', subtitle: '点击收集三处宫城线索', sceneKey: 'CourtyardScene' },
      { id: 'forbidden-city-ridge-beasts', title: '脊兽法式', subtitle: '按等级为十只脊兽排序', sceneKey: 'RidgeBeastScene' },
      { id: 'forbidden-city-flower-street', title: '花街寻吉', subtitle: '拼补四幅吉祥纹样', sceneKey: 'FlowerStreetScene' },
    ],
  },
  {
    id: 'suzhou-garden',
    name: '苏州拙政园',
    status: 'playable',
    levels: [
      { id: 'suzhou-cats', title: '巷陌寻踪', subtitle: '循着猫的脚印，找到园中的猫', sceneKey: 'GardenCatScene' },
      { id: 'suzhou-fish', title: '池畔逐影', subtitle: '为三区锦鲤投喂适量的食物', sceneKey: 'GardenFishScene' },
      { id: 'suzhou-goose', title: '水岸清羽', subtitle: '按步骤清洁并安抚白鹅', sceneKey: 'GardenGooseScene' },
      { id: 'suzhou-well', title: '天井通渠', subtitle: '清井 · 滤淤 · 分水 · 封栏', sceneKey: 'GardenWellScene' },
    ],
  },
  {
    id: 'yingxian-pagoda',
    name: '应县木塔',
    status: 'playable',
    levels: [
      { id: 'yingxian-timber', title: '良材甄选', subtitle: '按构件用途，为六种木材分类', sceneKey: 'WoodTimberScene' },
      { id: 'yingxian-dougong', title: '斗拱落棒', subtitle: '滑动鼠标，让斗拱对准卡槽落下', sceneKey: 'WoodDougongScene' },
      { id: 'yingxian-stacking', title: '层叠筑塔', subtitle: '按依赖顺序叠装木塔底层', sceneKey: 'WoodStackingScene' },
      { id: 'yingxian-load', title: '荷载校验', subtitle: '限时疏导人流，保持木塔荷载平衡', sceneKey: 'WoodLoadScene' },
    ],
  },
  {
    id: 'egypt-pyramid',
    name: '埃及金字塔',
    status: 'playable',
    levels: [
      { id: 'egypt-mural', title: '残破壁画', subtitle: '拼合象形符号壁画', sceneKey: 'EgyptMuralScene' },
      { id: 'egypt-spot', title: '文明破译', subtitle: '找出两幅壁画的 5 处差异', sceneKey: 'EgyptSpotScene' },
      { id: 'egypt-stealth', title: '甬道躲避', subtitle: '避开木乃伊的视野，抵达秘室', sceneKey: 'EgyptStealthScene' },
      { id: 'egypt-final', title: '密室寻宝', subtitle: '解开四道试炼，打开法老的宝箱', sceneKey: 'EgyptFinalScene' },
    ],
  },
  {
    id: 'petra',
    name: '佩特拉古城',
    status: 'playable',
    levels: [
      { id: 'petra-path', title: '红岩蛇道', subtitle: '在狭窄的峡谷中踩着稳固岩点前进', sceneKey: 'PetraPathScene' },
      { id: 'petra-camel', title: '荒漠商旅', subtitle: '操控骆驼避障，安全抵达驿站', sceneKey: 'PetraCamelScene' },
      { id: 'petra-canal', title: '岩壁古渠', subtitle: '搬开碎石、刮除淤泥、点通沙管', sceneKey: 'PetraCanalScene' },
      { id: 'petra-water', title: '荒漠生机', subtitle: '切换洪水与旱季，平衡水网', sceneKey: 'PetraWaterScene' },
    ],
  },
  {
    id: 'dome-rock',
    name: '圆顶清真寺',
    status: 'playable',
    levels: [
      { id: 'dome-wall', title: '八面圣墙', subtitle: '复原几何瓷砖', sceneKey: 'DomeWallScene' },
      { id: 'dome-light', title: '金穹定影', subtitle: '折射天光', sceneKey: 'DomeLightScene' },
      { id: 'dome-color', title: '圣境釉色', subtitle: '复原穹顶分区色彩', sceneKey: 'DomeColorScene' },
    ],
  },
  {
    id: 'angkor',
    name: '吴哥窟',
    status: 'playable',
    levels: [
      { id: 'angkor-gallery', title: '八百回廊', subtitle: '修复浮雕与史诗', sceneKey: 'AngkorGalleryScene' },
      { id: 'angkor-pool', title: '四方圣池', subtitle: '维持水量平衡', sceneKey: 'AngkorPoolScene' },
      // 🌟 第三关完美融入
      { id: 'angkor-boat', title: '环城水雾', subtitle: '驾驶木船穿越迷雾', sceneKey: 'AngkorBoatScene' }
    ],
  },
  {
    id: 'machu-picchu',
    name: '马丘比丘',
    status: 'playable',
    levels: [
      { id: 'machu-spot', title: '地质勘探', subtitle: '寻找地质隐患', sceneKey: 'MachuSpotScene' },
      { id: 'machu-defense', title: '云端天险', subtitle: '防守入侵者', sceneKey: 'MachuDefenseScene' },
      { id: 'machu-quarry', title: '采石修城', subtitle: '蓄力投石修城墙', sceneKey: 'MachuQuarryScene' },
      { id: 'machu-llama', title: '羊驼牧场', subtitle: '守护云端羊群', sceneKey: 'MachuLlamaScene' }
    ],
  }
]