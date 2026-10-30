import type { DougongLevelConfig, DougongShapeConfig } from '../../types.ts'

/** 4 种"斗拱形状" */
const SHAPES: DougongShapeConfig[] = [
  {
    id: 'cross',
    name: '十字拱',
    drawShape: (g) => {
      g.fillStyle(0xa84838, 1)
      g.fillRect(-8, -30, 16, 60)
      g.fillRect(-30, -8, 60, 16)
      g.lineStyle(2, 0x5a2018, 1)
      g.strokeRect(-8, -30, 16, 60)
      g.strokeRect(-30, -8, 60, 16)
    },
  },
  {
    id: 'gong',
    name: '工字拱',
    drawShape: (g) => {
      g.fillStyle(0xa84838, 1)
      g.fillRect(-30, -26, 60, 12)
      g.fillRect(-8, -14, 16, 28)
      g.fillRect(-30, 14, 60, 12)
      g.lineStyle(2, 0x5a2018, 1)
      g.strokeRect(-30, -26, 60, 12)
      g.strokeRect(-8, -14, 16, 28)
      g.strokeRect(-30, 14, 60, 12)
    },
  },
  {
    id: 'T',
    name: '丁字拱',
    drawShape: (g) => {
      g.fillStyle(0xa84838, 1)
      g.fillRect(-30, -26, 60, 14)
      g.fillRect(-8, -12, 16, 42)
      g.lineStyle(2, 0x5a2018, 1)
      g.strokeRect(-30, -26, 60, 14)
      g.strokeRect(-8, -12, 16, 42)
    },
  },
  {
    id: 'bar',
    name: '一字拱',
    drawShape: (g) => {
      g.fillStyle(0xa84838, 1)
      g.fillRect(-36, -8, 72, 16)
      g.lineStyle(2, 0x5a2018, 1)
      g.strokeRect(-36, -8, 72, 16)
    },
  },
]

export const woodDougongLevel: DougongLevelConfig & { shapes: DougongShapeConfig[] } = {
  id: 'yingxian-dougong',
  worldId: 'yingxian-pagoda',
  title: '斗拱落棒',
  chapter: '寻脉其三 · 其二',
  objective: '让斗拱与卡槽对齐落下',

  npc: {
    id: 'master-carpenter',
    name: '守塔匠人',
    title: '营造匠人',
    position: { tx: 0.25, ty: 8.0 },
    dialogue: [
      {
        speaker: '守塔匠人',
        text: '斗拱是木塔"伸出的手"——承接屋檐，分散重量。',
      },
      {
        speaker: '守塔匠人',
        text: '落榫时，形状要"对"、位置要"准"。差之毫厘，便咬不住。',
      },
      {
        speaker: '守塔匠人',
        text: '我放慢速度。你来接。',
      },
    ],
  },

  clues: [
    { id: 's1', name: '第一落', hint: '十字拱', position: { tx: 0, ty: 0 } },
    { id: 's2', name: '第二落', hint: '工字拱', position: { tx: 0, ty: 0 } },
    { id: 's3', name: '第三落', hint: '丁字拱', position: { tx: 0, ty: 0 } },
    { id: 's4', name: '第四落', hint: '一字拱', position: { tx: 0, ty: 0 } },
    { id: 's5', name: '第五落', hint: '十字拱', position: { tx: 0, ty: 0 } },
    { id: 's6', name: '第六落', hint: '工字拱', position: { tx: 0, ty: 0 } },
    { id: 's7', name: '第七落', hint: '丁字拱', position: { tx: 0, ty: 0 } },
    { id: 's8', name: '第八落', hint: '一字拱', position: { tx: 0, ty: 0 } },
  ],

    // 3 个堆叠位（左/中/右）
  slots: [
    { id: 'slot-l', shapeIds: ['cross', 'bar'], x: 360 },   // 左：十字 / 一字
    { id: 'slot-c', shapeIds: ['gong', 'T'], x: 640 },      // 中：工字 / 丁字
    { id: 'slot-r', shapeIds: ['cross', 'bar'], x: 920 },   // 右：十字 / 一字
  ],

  // 8 次下落序列（打乱顺序）
  sequence: ['cross', 'gong', 'T', 'bar', 'cross', 'gong', 'T', 'bar'],

  // 形状定义
  shapes: SHAPES,

  knowledgeCard: {
    title: '斗拱与榫卯',
    content:
      '应县木塔全塔用"榫卯"咬合，无一枚铁钉。\n' +
      '"斗拱"层层叠叠，每层"斗"与"拱"相互咬合——\n' +
      '受力时，层层分散；地震时，层层"退让"，反而不易断裂。\n' +
      '榫卯的智慧，是"不靠钉子硬咬，而靠形状相和"。',
    source: '参考资料：《营造法式》、《应县木塔》（史实复核中）',
  },

  azhuComment: '榫卯不靠"硬"，而靠"形状相和"。',
  successTitle: '斗拱归位',
  successBody: '八次下落，八次咬合。斗拱承檐，如手托天。',
}