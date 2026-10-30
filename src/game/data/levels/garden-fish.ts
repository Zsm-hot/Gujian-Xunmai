import type { FishLevelConfig } from '../../types.ts'

export const gardenFishLevel: FishLevelConfig = {
  id: 'suzhou-fish',
  worldId: 'suzhou-garden',
  title: '池畔逐影',
  chapter: '寻脉其二 · 其二',
  objective: '为三区锦鲤投喂适量的食物',

  npc: {
    id: 'old-gardener',
    name: '老园丁',
    title: '守园人',
    position: { tx: 0.25, ty: 8.0 },
    dialogue: [
      {
        speaker: '老园丁',
        text: '锦鲤池里养着几十尾锦鲤。喂食是件"讲分寸"的事。',
      },
      {
        speaker: '老园丁',
        text: '各区鱼的数量不同，所需的食量也不同。太多，水浊；太少，鱼瘦。',
      },
      {
        speaker: '老园丁',
        text: '还要挑对鱼食——有的食物锦鲤爱吃，却伤水。',
      },
    ],
  },

  clues: [
    { id: 'z-e', name: '东区', hint: '锦鲤 5 尾。', position: { tx: 11.0, ty: 6.0 } },
    { id: 'z-c', name: '中区', hint: '锦鲤 8 尾。', position: { tx: 7.0, ty: 6.0 } },
    { id: 'z-w', name: '西区', hint: '锦鲤 4 尾。', position: { tx: 3.0, ty: 7.0 } },
  ],

  foods: [
    {
      id: 'worm',
      name: '鱼虫',
      icon: '🪱',
      valid: true,
      hint: '锦鲤的主食，营养充足。',
    },
    {
      id: 'algae',
      name: '藻饼',
      icon: '🟢',
      valid: true,
      hint: '藻类压制，补色佳品。',
    },
    {
      id: 'bread',
      name: '面包',
      icon: '🍞',
      valid: false,
      hint: '人类食物，会污染水质。',
    },
  ],

  zones: [
    { id: 'z-e', name: '东区', tx: 11.0, ty: 6.0, minFeed: 3, maxFeed: 4 },
    { id: 'z-c', name: '中区', tx: 7.0, ty: 6.0, minFeed: 4, maxFeed: 5 },
    { id: 'z-w', name: '西区', tx: 3.0, ty: 7.0, minFeed: 2, maxFeed: 3 },
  ],

  knowledgeCard: {
    title: '园林中的锦鲤',
    content:
      '江南园林的水池多养锦鲤。锦鲤不只是观赏——它们"动水"、\n' +
      '净水，是"活的水循环"的一部分。\n' +
      '喂食讲"分寸"：过多则水质恶化，过少则鱼体消瘦。\n' +
      '园林的照护，是"和自然共处"的智慧——不是支配，而是"配合"。',
    source: '参考资料：《长物志》、《园冶》（史实复核中）',
  },

  azhuComment: '不是喂得多就好——恰到好处，才是最好的照料。',
  successTitle: '锦鲤悠然',
  successBody: '三区锦鲤各得其食，水面映出流动的光影。池畔逐影，得一池生机。',
}