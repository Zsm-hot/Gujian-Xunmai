import type { DomeLevelConfig } from '../../types.ts'

export const domeWallLevel: DomeLevelConfig = {
  id: 'dome-wall',
  worldId: 'dome-rock',
  title: '八面圣墙',
  chapter: '寻脉其六 · 其一',
  objective: '复原八面圣墙的几何瓷砖',

  npc: {
    id: 'geometry-master',
    name: '几何圣匠',
    title: '圣墙修补人',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '几何圣匠', text: '圣墙的每一块瓷砖，都遵循着严密的几何秩序。' },
      { speaker: '几何圣匠', text: '星形、十字形、三角形……它们拼合在一起，象征宇宙的圆满。' },
      { speaker: '几何圣匠', text: '请修复残破的墙砖，让圣光再次流转。' },
    ],
  },

  clues: [
    { id: 'c1', name: '瓷砖', hint: '拼合几何', position: { tx: 0, ty: 0 } },
  ],

  knowledgeCard: {
    title: '伊斯兰几何纹样',
    content:
      '圆顶清真寺（Dome of the Rock）的墙面装饰着极其精美的几何纹样。\n' +
      '由于伊斯兰教传统不鼓励具象的人物或动物崇拜，艺术家们发展出了极其复杂的几何与植物纹样（Arabesque）。\n' +
      '八角形、星形、无限延伸的线条，象征着安拉的无限与宇宙的秩序。',
    source: '参考资料：《伊斯兰建筑艺术》（史实复核中）',
  },

  azhuComment: '几何不仅是一种美，更是古人对宇宙秩序的凝视。',
  successTitle: '圣墙重现',
  successBody: '八面圣墙的几何秩序被复原，金色的光影再次流转。',

  // ===== 新增：阶段2规则配置 =====
  // 索引 1~7 对应 7 个待放置的单元，玩家需选择正确的规则才能拼合
  stage2Rules: [
    { targetIndex: 1, correctRule: 'mirror', angleTolerance: 10 },
    { targetIndex: 2, correctRule: 'rotate', angleTolerance: 10 },
    { targetIndex: 3, correctRule: 'mirror', angleTolerance: 10 },
    { targetIndex: 4, correctRule: 'flip',   angleTolerance: 10 },
    { targetIndex: 5, correctRule: 'mirror', angleTolerance: 10 },
    { targetIndex: 6, correctRule: 'rotate', angleTolerance: 10 },
    { targetIndex: 7, correctRule: 'flip',   angleTolerance: 10 },
  ],
  
}

export const domeLightLevel: DomeLevelConfig = {
  id: 'dome-light',
  worldId: 'dome-rock',
  title: '金穹定影',
  chapter: '寻脉其六 · 其二',
  objective: '旋转反射板，将天光折射到圣墙的靶点上',
  npc: {
    id: 'geometry-master',
    name: '几何圣匠',
    title: '圣墙修补人',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '几何圣匠', text: '圣墙需要天光的洗礼，但光路被阻断了。' },
      { speaker: '几何圣匠', text: '请利用这些古老的铜镜，改变光的方向。' },
      { speaker: '几何圣匠', text: '让每一束光，都精准地落在它该去的靶点上。' },
    ],
  },
  clues: [],
  knowledgeCard: {
    title: '伊斯兰建筑的光影',
    content: '伊斯兰建筑极擅长利用光影来营造神圣感。通过复杂的几何窗棂和穹顶的反射，天光被切割、折射，形成斑驳的光影效果。',
    source: '参考资料：《世界建筑史》',
  },
  azhuComment: '光与影的舞蹈，也是几何学的一种表达。',
  successTitle: '圣光流转',
  successBody: '天光顺着铜镜的指引，精准地落在了圣墙之上。',
}
export const domeColorLevel: DomeLevelConfig = {
  id: 'dome-color',
  worldId: 'dome-rock',
  title: '圣境釉色',
  chapter: '寻脉其六 · 其三',
  objective: '按照色彩秩序，复原金穹顶的釉色分区',
  npc: {
    id: 'geometry-master',
    name: '几何圣匠',
    title: '圣墙修补人',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '几何圣匠', text: '色彩并非随意涂抹，它象征着不同的神圣层级。' },
      { speaker: '几何圣匠', text: '最内层是天穹的深蓝，中间是日光的金黄，最外侧是生命的翠绿。' },
      { speaker: '几何圣匠', text: '请小心挑选釉料，让穹顶恢复往日的辉光。' },
    ],
  },
  clues: [],
  knowledgeCard: {
    title: '伊斯兰建筑的色彩',
    content: '伊斯兰建筑常用蓝色象征天空与宇宙，绿色象征生命与乐园，金黄色代表神圣的光芒。这种色彩的运用不仅是为了美观，更是一种空间秩序的传达。',
    source: '参考资料：《伊斯兰艺术与建筑》',
  },
  azhuComment: '原来每一种颜色，都在诉说着古老的故事。',
  successTitle: '光影重现',
  successBody: '天光洒下，穹顶的每一层釉色都焕发出了曾经的辉煌。',
}