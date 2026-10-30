import type { LevelConfig } from '../../types.ts'

export const petraWaterLevel: LevelConfig = {
  id: 'petra-water',
  worldId: 'petra',
  title: '荒漠生机',
  chapter: '寻脉其五 · 其四',
  objective: '调控水网，抵御洪水并蓄水抗旱',

  npc: {
    id: 'desert-guide',
    name: '沙漠先民',
    title: '古道向导',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '沙漠先民', text: '纳巴泰人是水的大师。他们能在暴洪中保全城池，也能在旱季养活数万人。' },
      { speaker: '沙漠先民', text: '当暴雨来临（洪水模式），别让水冲垮蓄水池，把阀门拖到【泄洪道】。' },
      { speaker: '沙漠先民', text: '当干旱降临（旱季模式），把阀门拖回【蓄水池】，保住珍贵的水源。' },
    ],
  },

  clues: [
    { id: 'c1', name: '水网', hint: '调度水资源', position: { tx: 0, ty: 0 } },
  ],

  knowledgeCard: {
    title: '纳巴泰人的水利',
    content:
      '佩特拉的水利系统是古代世界的奇迹。\n' +
      '他们利用岩壁的倾斜，修建了复杂的引水渠。在暴雨时，巨大的暗渠能将洪水导走，避免城池被淹；\n' +
      '在干旱时，密封的陶管和蓄水池能锁住每一滴水。\n' +
      '正是这种对水的极致掌控，让玫瑰古城在沙漠中繁荣了数百年。',
    source: '参考资料：《佩特拉水利与建筑》（史实复核中）',
  },

  azhuComment: '能在暴雨中保全自己，也能在干旱中延续生命——这就是古人治水的智慧。',
  successTitle: '水脉永续',
  successBody: '洪水退去，池水盈盈。佩特拉在干涸的荒漠中，又一次赢得了生机。',
}