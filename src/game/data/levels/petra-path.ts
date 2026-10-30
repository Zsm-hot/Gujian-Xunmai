import type { PetraLevelConfig } from '../../types.ts'

export const petraPathLevel: PetraLevelConfig = {
  id: 'petra-path',
  worldId: 'petra',
  title: '红岩蛇道',
  chapter: '寻脉其五 · 其一',
  objective: '沿着稳固的岩点，穿过狭窄的蛇道',

  npc: {
    id: 'desert-guide',
    name: '沙漠先民',
    title: '古道向导',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '沙漠先民', text: '欢迎来到玫瑰古城。前方的蛇道深不见底，岩壁随时会崩塌。' },
      { speaker: '沙漠先民', text: '必须踩着稳固的岩点前进，千万别踩那些松动的碎石。' },
      { speaker: '沙漠先民', text: '终点在峡谷的最深处。祝你好运。' },
    ],
  },

  clues: [
    { id: 'r1', name: '稳固岩点', hint: '安全的落脚处', position: { tx: 0, ty: 0 } },
  ],

  startPos: { x: 100, y: 360 },
  endPos: { x: 1180, y: 360 },

  // 屏幕上的岩点分布
  rocks: [],

  knowledgeCard: {
    title: '佩特拉的蛇道',
    content:
      '佩特拉古城隐藏在约旦的群山之中。进入古城的唯一通道是一条名为“蛇道”（Al-Siq）的狭窄峡谷。\n' +
      '峡谷最窄处仅容两人并行，两侧岩壁高达百米。\n' +
      '古人利用这里的地形，修建了水渠和水利系统，并设下重重机关，保护这座“玫瑰之城”。',
    source: '参考资料：《佩特拉古城考古报告》（史实复核中）',
  },

  azhuComment: '峡谷中的每一步，都是对勇气与敏锐的考验。',
  successTitle: '穿越峡谷',
  successBody: '踩过稳固的岩点，你终于穿过了深邃的蛇道，看到了前方玫瑰色的殿宇。',
}