import type { StealthLevelConfig } from '../../types.ts'

export const egyptStealthLevel: StealthLevelConfig = {
  id: 'egypt-stealth',
  worldId: 'egypt-pyramid',
  title: '甬道躲避',
  chapter: '寻脉其四 · 其三',
  objective: '避开木乃伊的视野，抵达秘室',

  npc: {
    id: 'anubis-guard',
    name: '阿努比斯守卫',
    title: '冥界向导',
    position: { tx: 0, ty: 0 },
    dialogue: [
      {
        speaker: '阿努比斯守卫',
        text: '法老的陵墓里，有守卫在游荡。别撞上它们的目光。',
      },
      {
        speaker: '阿努比斯守卫',
        text: '用方向键（或 WASD）慢慢走。只要不被光锥扫到，就能活下来。',
      },
      {
        speaker: '阿努比斯守卫',
        text: '去右上角的秘室吧。',
      },
    ],
  },

  clues: [
    { id: 'c1', name: '出口', hint: '右上角', position: { tx: 0, ty: 0 } },
  ],

  // 起点与终点
  startPos: { x: 100, y: 600 },
  exitPos: { x: 1100, y: 150 },

  // 2 个木乃伊
  mummies: [
    {
      id: 'm1',
      startX: 300,
      startY: 300,
      endX: 600,
      endY: 300,
      speed: 100,
      viewAngle: 60,      // 左右 60 度
      viewRange: 180,     // 视线距离
    },
    {
      id: 'm2',
      startX: 800,
      startY: 500,
      endX: 800,
      endY: 250,
      speed: 80,
      viewAngle: 60,
      viewRange: 200,
    },
     {
      id: 'm3',
      startX: 200,
      startY: 600,
      endX: 500,
      endY: 600,
      speed: 120,
      viewAngle: 70,
      viewRange: 160,
    },
  ],

  knowledgeCard: {
    title: '金字塔的内部',
    content:
      '金字塔内部是巨大的迷宫，由狭窄的甬道和墓室组成。\n' +
      '为了防盗墓贼，古人设计了复杂的通道、暗门，\n' +
      '以及传说中的“法老诅咒”。\n' +
      '在古埃及的信仰中，阿努比斯（胡狼头神）是亡灵的向导，也是陵墓的守护者。',
    source: '参考资料：《金字塔铭文》（史实复核中）',
  },

  azhuComment: '在黑暗中潜行，是对勇气与耐心的双重考验。',
  successTitle: '秘室在望',
  successBody: '避开守卫，你来到了法老的安息之所。',
}