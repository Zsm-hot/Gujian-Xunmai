import type { TimberLevelConfig } from '../../types.ts'

export const woodTimberLevel: TimberLevelConfig = {
  id: 'yingxian-timber',
  worldId: 'yingxian-pagoda',
  title: '良材甄选',
  chapter: '寻脉其三 · 其一',
  objective: '按构件用途，把六种木材分类',

  npc: {
    id: 'master-carpenter',
    name: '守塔匠人',
    title: '营造匠人',
    position: { tx: 0.25, ty: 8.0 },
    dialogue: [
      {
        speaker: '守塔匠人',
        text: '木塔千年不倒，靠的不只是"硬"——而是"每根木头用在恰当的地方"。',
      },
      {
        speaker: '守塔匠人',
        text: '柱要"直"、梁要"韧"、斗拱要"密"。六种木材，各有各的去处。',
      },
      {
        speaker: '守塔匠人',
        text: '你且把它们分开。',
      },
    ],
  },

  clues: [
    { id: 't1', name: '松木', hint: '直且耐腐——柱材。', position: { tx: 5.0, ty: 5.0 } },
    { id: 't2', name: '柏木', hint: '直且耐腐——柱材。', position: { tx: 5.0, ty: 5.0 } },
    { id: 't3', name: '杉木', hint: '韧而轻——梁材。', position: { tx: 5.0, ty: 5.0 } },
    { id: 't4', name: '榆木', hint: '韧而重——梁材。', position: { tx: 5.0, ty: 5.0 } },
    { id: 't5', name: '楠木', hint: '细且密——斗拱材。', position: { tx: 5.0, ty: 5.0 } },
    { id: 't6', name: '柞木', hint: '硬且密——斗拱材。', position: { tx: 5.0, ty: 5.0 } },
  ],

  timbers: [
    { id: 't1', name: '松木', icon: '🌲', categoryId: 'zhu', hint: '直木，做柱' },
    { id: 't2', name: '柏木', icon: '🌲', categoryId: 'zhu', hint: '耐腐，做柱' },
    { id: 't3', name: '杉木', icon: '🌲', categoryId: 'liang', hint: '轻韧，做梁' },
    { id: 't4', name: '榆木', icon: '🌲', categoryId: 'liang', hint: '重韧，做梁' },
    { id: 't5', name: '楠木', icon: '🌲', categoryId: 'gong', hint: '细密，做斗拱' },
    { id: 't6', name: '柞木', icon: '🌲', categoryId: 'gong', hint: '硬密，做斗拱' },
  ],

  categories: [
    { id: 'zhu', name: '柱材', icon: '⬛', tx: 2.0, ty: 12.0 },
    { id: 'liang', name: '梁材', icon: '⬛', tx: 5.5, ty: 12.0 },
    { id: 'gong', name: '斗拱材', icon: '⬛', tx: 9.0, ty: 12.0 },
  ],

  knowledgeCard: {
    title: '木材与构件',
    content:
      '应县木塔用"松、柏、杉、榆、楠、柞"等多种木材。\n' +
      '"柱"需"直且耐腐"——多用松、柏；\n' +
      '"梁"需"韧而轻"——多用杉、榆；\n' +
      '"斗拱"需"细而密"——多用楠、柞。\n' +
      '不同构件承担不同"受力角色"，选材也各有讲究。',
    source: '参考资料：《营造法式》、《应县木塔》（史实复核中）',
  },

  azhuComment: '木塔千年不倒——不是"木头硬"，而是"木头用在恰当的地方"。',
  successTitle: '良材归位',
  successBody: '六种木材各归其位。柱、梁、斗拱，各司其职。',
}