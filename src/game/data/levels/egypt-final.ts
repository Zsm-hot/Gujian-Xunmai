import type { FinalLevelConfig } from '../../types.ts'

export const egyptFinalLevel: FinalLevelConfig = {
  id: 'egypt-final',
  worldId: 'egypt-pyramid',
  title: '密室寻宝',
  chapter: '寻脉其四 · 其四',
  objective: '完成四个古老谜题，打开法老的宝箱',

  npc: {
    id: 'anubis-guard',
    name: '阿努比斯守卫',
    title: '冥界向导',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '阿努比斯守卫', text: '你来到了最深处的密室。这里隐藏着《营造之书》的一页。' },
      { speaker: '阿努比斯守卫', text: '但要拿到它，你必须解开四位古神留下的试炼。' },
      { speaker: '阿努比斯守卫', text: '去吧，完成它们。' },
    ],
  },

  clues: [
    { id: 'c1', name: '符文矩阵', hint: '点亮全部', position: { tx: 0, ty: 0 } },
  ],

  knowledgeCard: {
    title: '古埃及的智慧',
    content:
      '古埃及人将智慧藏于星辰、几何与神话之中。\n' +
      '符文代表秩序，星象代表时间，通道代表抉择，圣符代表信仰。\n' +
      '四者合一，构成了他们对宇宙的理解。',
    source: '参考资料：《金字塔铭文》（史实复核中）',
  },

  azhuComment: '真正的宝藏，是解开这些谜题所展现的智慧。',
  successTitle: '法老的宝藏',
  successBody: '四道试炼全部完成。祭坛的宝箱缓缓打开，里面是失落的一页《营造之书》。',
}