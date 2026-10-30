import type { LevelConfig } from '../../types.ts'

export const petraCanalLevel: LevelConfig = {
  id: 'petra-canal',
  worldId: 'petra',
  title: '岩壁古渠',
  chapter: '寻脉其五 · 其三',
  objective: '疏通古渠的三种堵塞',

  npc: {
    id: 'desert-guide',
    name: '沙漠先民',
    title: '古道向导',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '沙漠先民', text: '玫瑰古城的生命，全依赖岩壁上这条古渠。' },
      { speaker: '沙漠先民', text: '石块要搬开，淤泥要刮掉，管口的细沙要精准挑出。' },
      { speaker: '沙漠先民', text: '一旦水流通畅，这座城就能重新活过来。' },
    ],
  },

  clues: [
    { id: 'c1', name: '古渠', hint: '岩壁上的水渠', position: { tx: 0, ty: 0 } },
  ],

  knowledgeCard: {
    title: '佩特拉的水利系统',
    content:
      '佩特拉身处沙漠，年降雨量极少，却曾养育了数万人。\n' +
      '纳巴泰人利用岩壁的坡度，修建了错综复杂的水渠、水坝和陶管。\n' +
      '他们能收集冬季的暴洪，过滤泥沙，再将珍贵的水分配到不同的神庙、住宅和花园。\n' +
      '水，就是这座城的信仰。',
    source: '参考资料：《佩特拉水网考古》（史实复核中）',
  },

  azhuComment: '当水重新流动时，这座石头城才算真正醒来。',
  successTitle: '泉脉苏醒',
  successBody: '岩壁细流汇聚成溪，干枯的古渠重新焕发了生机。',
}