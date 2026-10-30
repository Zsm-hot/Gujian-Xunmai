import type { LevelConfig } from '../../types.ts'

export const courtyardLevel: LevelConfig = {
  id: 'forbidden-city-hall',
  worldId: 'forbidden-city',
  title: '故宫拾遗',
  chapter: '寻脉其一',
  objective: '拾取三处宫城线索',
  npc: {
    id: 'tai-shi',
    name: '紫禁守礼太史',
    title: '守礼太史',
    position: { tx: 7.2, ty: 9.4 },
    dialogue: [
      {
        speaker: '紫禁守礼太史',
        text: '晨光落在金瓦之上。这座宫城的每一块砖、每一根柱，都在讲述一种秩序。',
      },
      {
        speaker: '紫禁守礼太史',
        text: '散落的神兽并非普通装饰。它们的排列、殿宇的等级与院落的轴线，共同构成一套可被阅读的秩序。',
      },
      {
        speaker: '紫禁守礼太史',
        text: '先走过院落，找回三处失落的线索吧。',
      },
    ],
  },
  clues: [
    {
      id: 'ridge-beast',
      name: '檐角脊兽',
      hint: '檐角的脊兽，是殿宇等级的象征。',
      position: { tx: 5.2, ty: 4.4 },
    },
    {
      id: 'stone-carving',
      name: '丹陛石刻',
      hint: '丹陛上的石刻，是通往大殿的礼制之路。',
      position: { tx: 8.6, ty: 11.2 },
    },
    {
      id: 'brick-pattern',
      name: '金砖铺地',
      hint: '金砖铺地的纹样，铺出了宫城的秩序感。',
      position: { tx: 11.4, ty: 7.2 },
    },
  ],
  knowledgeCard: {
    title: '脊兽与殿宇等级',
    content:
      '紫禁城屋顶上的脊兽并非单纯的装饰，\n' +
      '而是一套可阅读的等级符号。\n' +
      '太和殿用十只脊兽，是全国唯一"满十"的殿宇；\n' +
      '乾清宫九只，坤宁宫七只，等级依次递减。\n' +
      '脊兽的数量、材质（琉璃或瓦）、殿顶的形式\n' +
      '（庑殿、歇山、攒尖），共同构成一套"礼制语法"。',
    source: '参考资料：《清式营造则例》、《紫禁城建筑图典》（史实复核中）',
  },
  azhuComment:
    '礼制不是冷冰冰的规矩，而是古人用空间表达的责任与分寸。',
  successTitle: '院落记忆已归位',
  successBody:
    '脊兽、石刻、铺地三处线索已齐。\n'+'太史说："秩序不是约束，是给每一种生活留出恰当的位置。"',
}