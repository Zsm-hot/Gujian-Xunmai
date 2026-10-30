import type { GooseLevelConfig } from '../../types.ts'

export const gardenGooseLevel: GooseLevelConfig = {
  id: 'suzhou-goose',
  worldId: 'suzhou-garden',
  title: '水岸清羽',
  chapter: '寻脉其二 · 其三',
  objective: '按步骤清洁并安抚白鹅',

  npc: {
    id: 'old-gardener',
    name: '老园丁',
    title: '守园人',
    position: { tx: 0.25, ty: 8.0 },
    dialogue: [
      {
        speaker: '老园丁',
        text: '园里那只白鹅，今早沾了泥。得按顺序来——先清地，后洗身。',
      },
      {
        speaker: '老园丁',
        text: '洗的时候别冲头颈——鹅会惊。慢慢来。',
      },
      {
        speaker: '老园丁',
        text: '梳、擦、喂——一步都不能少。',
      },
    ],
  },

  clues: [
    { id: 's1', name: '清理岸边', hint: '先扫净岸上的杂物。', position: { tx: 5.0, ty: 8.0 } },
    { id: 's2', name: '轻淋鹅身', hint: '只淋身，避开头部。', position: { tx: 5.0, ty: 8.0 } },
    { id: 's3', name: '顺毛梳理', hint: '顺着羽向梳。', position: { tx: 5.0, ty: 8.0 } },
    { id: 's4', name: '擦干羽毛', hint: '用软巾吸水。', position: { tx: 5.0, ty: 8.0 } },
    { id: 's5', name: '安抚投喂', hint: '给少量谷物。', position: { tx: 5.0, ty: 8.0 } },
  ],

  goosePosition: { tx: 5.0, ty: 8.0 },

  tools: [
    {
      id: 'broom',
      name: '扫帚',
      icon: '🧹',
      stepIndex: 1,
      tip: '先清理岸边的杂物。',
    },
    {
      id: 'kettle',
      name: '水壶',
      icon: '🫖',
      stepIndex: 2,
      tip: '轻轻淋鹅身——避开头部。',
    },
    {
      id: 'comb',
      name: '梳子',
      icon: '🪮',
      stepIndex: 3,
      tip: '顺着羽毛梳理。',
    },
    {
      id: 'towel',
      name: '毛巾',
      icon: '🧻',
      stepIndex: 4,
      tip: '轻按吸水，别摩擦。',
    },
    {
      id: 'grain',
      name: '谷物',
      icon: '🌾',
      stepIndex: 5,
      tip: '少量投放，安抚它。',
    },
  ],

  knowledgeCard: {
    title: '园林中的白鹅',
    content:
      '江南园林中养鹅，不只是观赏——鹅"驱蛇"、"清草"、\n' +
      '也让水面"活"起来。\n' +
      '照护白鹅有讲究：先清环境，再洗身；洗时避开头部，\n' +
      '梳毛要"顺向"，擦干要"轻按"。\n' +
      '园林的"共生"，是"顺着它的习性照料"，不是"按人的方便来"。',
    source: '参考资料：《长物志》、《园冶》（史实复核中）',
  },

  azhuComment: '照料不是"我做主"——而是"顺着它"的节奏。',
  successTitle: '清羽如初',
  successBody: '五步做完，白鹅的羽毛重新透亮。它轻轻抖羽，与这一池水相安。',
}