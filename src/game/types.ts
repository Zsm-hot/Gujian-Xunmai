export type WorldId =
  | 'forbidden-city'
  | 'suzhou-garden'
  | 'yingxian-pagoda'
  | 'egypt-pyramid'
  | 'petra'
  | 'dome-rock'
  | 'angkor'
  | 'machu-picchu'

export type DialogueLine = {
  speaker: string
  text: string
}

export type IsoPoint = {
  tx: number
  ty: number
}

export type NpcConfig = {
  id: string
  name: string
  title: string
  position: IsoPoint
  dialogue: DialogueLine[]
}

export type ClueConfig = {
  id: string
  name: string
  hint: string
  position: IsoPoint
}

/** 知识卡：通关后弹出的科普卡片 */
export type KnowledgeCard = {
  title: string
  content: string
  source?: string
}

export type LevelConfig = {
  id: string
  worldId: WorldId
  title: string
  chapter: string
  objective: string
  npc: NpcConfig
  clues: ClueConfig[]
  /** 通关后弹出的知识卡 */
  knowledgeCard: KnowledgeCard
  /** 阿筑的短评（阿筑：引路仙女 / 旁白者） */
  azhuComment: string
  successTitle: string
  successBody: string
}
/** 拖拽排序关卡 */
export type SortItem = {
  id: string          // 内部 ID
  label: string       // 显示名（如"龙"、"凤"）
  hint?: string       // 悬停提示
}

export type SortSlot = {
  id: string          // 槽位 ID
  label: string       // 槽位名（如"第一脊"）
}

export type RidgeBeastLevel = {
  id: string
  worldId: WorldId
  title: string
  chapter: string
  objective: string
  npc: NpcConfig
  items: SortItem[]       // 乱序的十只脊兽
  slots: SortSlot[]       // 正确的槽位顺序
  answer: string[]        // 正确答案（slot.id → item.id）
  knowledgeCard: KnowledgeCard
  azhuComment: string
  successTitle: string
  successBody: string
}
/** 猫脚印（巷陌寻踪专用） */
export type PawPrintConfig = {
  id: string
  name: string
  hint: string
  position: IsoPoint
  whisper?: string   // 点击后的"内心独白"
}

/** 猫的位置（集齐脚印后出现） */
export type CatSpot = {
  tx: number
  ty: number
}

/** "巷陌寻踪"关卡配置 */
export type CatLevelConfig = LevelConfig & {
  pawPrints: PawPrintConfig[]
  cats: CatSpot[]
}
/** 一个世界内部的一个关卡 */
export type LevelEntry = {
  id: string              // 关卡 ID（和 data/levels/xxx.ts 的 id 一致）
  title: string           // 显示名（"故宫拾遗"）
  subtitle: string        // 一句话简介（"点击收集三处线索"）
  sceneKey: string        // 对应的 Phaser 场景 key（"CourtyardScene"）
}
/** 鱼食（池畔逐影专用） */
export type FishFoodConfig = {
  id: string
  name: string
  icon: string
  valid: boolean
  hint: string
}

/** 池区（池畔逐影专用） */
export type PondZoneConfig = {
  id: string
  name: string
  tx: number
  ty: number
  minFeed: number
  maxFeed: number
}

/** "池畔逐影"关卡配置 */
export type FishLevelConfig = LevelConfig & {
  foods: FishFoodConfig[]
  zones: PondZoneConfig[]
}
export type WorldEntry = {
  id: WorldId
  name: string
  status: 'playable' | 'planned'
  levels?: LevelEntry[]   // 可玩世界的关卡列表
}
/** 清洁工具（水岸清羽专用） */
export type CleaningToolConfig = {
  id: string
  name: string
  icon: string
  stepIndex: number      // 第几步用这个工具（1~5）
  tip: string            // 使用提示
}

/** "水岸清羽"关卡配置 */
export type GooseLevelConfig = LevelConfig & {
  tools: CleaningToolConfig[]
  goosePosition: { tx: number; ty: number }   // 鹅的位置
}
/** 井中杂物（天井通渠 · 阶段 1） */
export type WellDebrisConfig = {
  id: string
  name: string
  icon: string
  tx: number
  ty: number
}

/** 水管口（天井通渠 · 阶段 2） */
export type WellPipeConfig = {
  id: string
  name: string
  tx: number
  ty: number
}

/** 分配对象（天井通渠 · 阶段 3） */
export type WellTargetConfig = {
  id: string
  name: string
  icon: string
  tx: number
  ty: number
  needMin: number
  needMax: number
}

/** 井盖碎片（天井通渠 · 阶段 4） */
export type WellCoverPieceConfig = {
  id: string
  slotId: string
  drawFn?: never   // 占位（不需要）
}

/** "天井通渠"关卡配置 */
export type WellLevelConfig = LevelConfig & {
  debris: WellDebrisConfig[]
  pipes: WellPipeConfig[]
  targets: WellTargetConfig[]
  coverPieces: { id: string; slotId: string }[]
  coverSlots: { id: string; x: number; y: number }[]
  wellPosition: { tx: number; ty: number }   // ★ 新加
}
/** 木材（良材甄选专用） */
export type TimberConfig = {
  id: string
  name: string
  icon: string
  categoryId: string       // 属于哪个"用途"
  hint: string
}

/** 用途（良材甄选专用） */
export type TimberCategoryConfig = {
  id: string
  name: string
  icon: string
  tx: number
  ty: number
}

/** "良材甄选"关卡配置 */
export type TimberLevelConfig = LevelConfig & {
  timbers: TimberConfig[]
  categories: TimberCategoryConfig[]
}
/** 斗拱形状（斗拱落棒专用） */
export type DougongShapeConfig = {
  id: string
  name: string
  /** 形状绘制函数，宽 60 高 60，中心为 0,0 */
  drawShape: (g: Phaser.GameObjects.Graphics) => void
}

/** 卡槽（斗拱落棒专用） */
export type DougongSlotConfig = {
  id: string
  shapeIds: string[]   // 该卡槽"接受的形状"（多个）
  x: number
}

/** "斗拱落棒"关卡配置 */
export type DougongLevelConfig = LevelConfig & {
  slots: DougongSlotConfig[]
  /** 每次下落的顺序（shapeId 数组） */
  sequence: string[]
}
/** 构件（层叠筑塔专用） */
export type StackPartConfig = {
  id: string
  name: string
  icon: string       // 文字简画（例如 "───" "──" 等）
  orderIndex: number // 第几步（1~5）
  height: number     // 叠上去"占多高"（px）
  color: number      // 砖色
  hint: string
}

/** "层叠筑塔"关卡配置 */
export type StackLevelConfig = LevelConfig & {
  parts: StackPartConfig[]
}
/** "荷载校验"关卡配置 */
export type LoadLevelConfig = LevelConfig & {
  capacity: number      // 每层上限
  targetSafeSeconds: number  // 需要累积的安全秒数
  totalSeconds: number       // 总限时
  spawnInterval: number      // 游客生成间隔（毫秒）
}
/** 木乃伊巡逻配置（甬道躲避专用） */
export type MummyPatrolConfig = {
  id: string
  startX: number
  startY: number
  endX: number
  endY: number
  speed: number        // 移动速度
  viewAngle: number    // 视野角度（度数）
  viewRange: number    // 视野半径
}

/** "甬道躲避"关卡配置 */
export type StealthLevelConfig = LevelConfig & {
  mummies: MummyPatrolConfig[]
  startPos: { x: number; y: number }
  exitPos: { x: number; y: number }
}
/** 密室寻宝（最终关）配置 */
export type FinalLevelConfig = LevelConfig & {
  // 只需基础字段，具体逻辑都在场景里硬编码
}
/** 蛇道岩点（红岩蛇道专用） */
export type RockNodeConfig = {
  id: string
  x: number
  y: number
  stable: boolean   // 是否是稳固的岩点
}

/** "红岩蛇道"关卡配置 */
export type PetraLevelConfig = LevelConfig & {
  rocks: RockNodeConfig[]
  startPos: { x: number; y: number }
  endPos: { x: number; y: number }
}
/** 几何瓷砖（八面圣墙专用） */
export type TileConfig = {
  id: string
  type: 'star' | 'cross' | 'triangle' // 形状
  color: number
}

/** 阶段2：镜像/旋转复制的规则配置 */
export type DomeStage2Rule = {
  /** 第几个待放置的单元（1~7） */
  targetIndex: number
  /** 该单元应该使用的正确规则 */
  correctRule: 'mirror' | 'flip' | 'rotate'
  /** 角度容差（预留，用于后续更精细的判定） */
  angleTolerance: number
}

/** "八面圣墙"关卡配置 */
export type DomeLevelConfig = LevelConfig & {
  /** 阶段2的规则配置（可选，阶段1不需要） */
  stage2Rules?: DomeStage2Rule[]
}