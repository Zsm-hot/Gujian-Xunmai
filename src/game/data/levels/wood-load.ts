import type { LoadLevelConfig } from '../../types.ts'

export const woodLoadLevel: LoadLevelConfig = {
  id: 'yingxian-load',
  worldId: 'yingxian-pagoda',
  title: '荷载校验',
  chapter: '寻脉其三 · 其四',
  objective: '平衡木塔三层的游客荷载，避免过载',

  npc: {
    id: 'master-carpenter',
    name: '守塔匠人',
    title: '营造匠人',
    position: { tx: 0.25, ty: 8.0 },
    dialogue: [
      {
        speaker: '守塔匠人',
        text: '木塔虽坚，但"受力"有极限。人潮涌来时，要懂得"分散"。',
      },
      {
        speaker: '守塔匠人',
        text: '哪层红了，赶紧把人往别处引。别让重量都压在一边。',
      },
      {
        speaker: '守塔匠人',
        text: '撑过这波人流，塔就安稳了。',
      },
    ],
  },

  clues: [
    { id: 'f1', name: '左层', hint: '左层负载', position: { tx: 0, ty: 0 } },
    { id: 'f2', name: '中层', hint: '中层负载', position: { tx: 0, ty: 0 } },
    { id: 'f3', name: '右层', hint: '右层负载', position: { tx: 0, ty: 0 } },
  ],

  capacity: 6,
  targetSafeSeconds: 3,
  totalSeconds: 45,
  spawnInterval: 999999, // 不用它了

  knowledgeCard: {
    title: '木塔的荷载',
    content:
      '木塔的"荷载"不只是"自身重量"，也包括"人、风、雪"。\n' +
      '如果"局部过载"，木构会变形；如果"均匀受力"，结构就稳固。\n' +
      '古人的"疏导智慧"——让"多的人"往"少的地方"走，\n' +
      '就是"结构平衡"的实践。',
    source: '参考资料：《营造法式》、《应县木塔》（史实复核中）',
  },

  azhuComment: '塔稳不稳，看"受力"匀不匀。',
  successTitle: '荷载平稳',
  successBody: '人潮退去，三层平稳。木塔安然度过一波涌动。',
}