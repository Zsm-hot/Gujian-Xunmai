import type { StackLevelConfig } from '../../types.ts'

export const woodStackingLevel: StackLevelConfig = {
  id: 'yingxian-stacking',
  worldId: 'yingxian-pagoda',
  title: '层叠筑塔',
  chapter: '寻脉其三 · 其三',
  objective: '按依赖顺序叠装木塔底层',

  npc: {
    id: 'master-carpenter',
    name: '守塔匠人',
    title: '营造匠人',
    position: { tx: 0.25, ty: 8.0 },
    dialogue: [
      {
        speaker: '守塔匠人',
        text: '木塔不倒，不是"层层堆"就成——而是"层层咬合"。',
      },
      {
        speaker: '守塔匠人',
        text: '基底、内槽、外槽、横梁、斜撑——次序错一步，便全盘不稳。',
      },
      {
        speaker: '守塔匠人',
        text: '从底开始，一层层往上。',
      },
    ],
  },

  clues: [
    { id: 'c1', name: '基底', hint: '底层基座', position: { tx: 0, ty: 0 } },
    { id: 'c2', name: '内槽柱', hint: '内层柱', position: { tx: 0, ty: 0 } },
    { id: 'c3', name: '外槽柱', hint: '外层柱', position: { tx: 0, ty: 0 } },
    { id: 'c4', name: '横梁', hint: '水平梁', position: { tx: 0, ty: 0 } },
    { id: 'c5', name: '斜撑', hint: '斜向支撑', position: { tx: 0, ty: 0 } },
  ],

  parts: [
    {
      id: 'p1',
      name: '基底',
      icon: '═══',
      orderIndex: 1,
      height: 16,
      color: 0x8a5a30,
      hint: '先立基座',
    },
    {
      id: 'p2',
      name: '内槽柱',
      icon: '┃┃',
      orderIndex: 2,
      height: 26,
      color: 0xa84838,
      hint: '内层柱立',
    },
    {
      id: 'p3',
      name: '外槽柱',
      icon: '┃ ┃',
      orderIndex: 3,
      height: 26,
      color: 0xc85848,
      hint: '外层柱立',
    },
    {
      id: 'p4',
      name: '横梁',
      icon: '═══',
      orderIndex: 4,
      height: 12,
      color: 0x8a3828,
      hint: '横梁压顶',
    },
    {
      id: 'p5',
      name: '斜撑',
      icon: '╱ ╲',
      orderIndex: 5,
      height: 20,
      color: 0x5a2018,
      hint: '斜撑稳住',
    },
  ],

  knowledgeCard: {
    title: '木塔的层叠',
    content:
      '应县木塔底层，由"基底 → 柱 → 梁 → 斜撑"逐层组成。\n' +
      '每一层都"依赖"前一层——\n' +
      '基底不稳，柱必斜；柱不直，梁必偏；梁不平，斜撑必松。\n' +
      '木构的"层叠"，是"相互依赖"层层成立——\n' +
      '不是"堆叠"，而是"彼此成全"。',
    source: '参考资料：《营造法式》、《应县木塔》（史实复核中）',
  },

  azhuComment: '木塔不倒，不是"堆得高"，而是"叠得稳"。',
  successTitle: '层叠成塔',
  successBody: '五层叠合，稳如磐石。一塔之始，始于底层。',
}