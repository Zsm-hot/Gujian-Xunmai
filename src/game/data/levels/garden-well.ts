import type { WellLevelConfig } from '../../types.ts'

export const gardenWellLevel: WellLevelConfig = {
  id: 'suzhou-well',
  worldId: 'suzhou-garden',
  title: '天井通渠',
  chapter: '寻脉其二 · 其四',
  objective: '清井 · 滤淤 · 分水 · 封栏',

  npc: {
    id: 'old-gardener',
    name: '老园丁',
    title: '守园人',
    position: { tx: 0.25, ty: 8.0 },
    dialogue: [
      {
        speaker: '老园丁',
        text: '园里的古井，多年没清了。井是"园的心脏"，得慢慢疏通。',
      },
      {
        speaker: '老园丁',
        text: '先清杂物，再滤淤塞；再分水给花、树、鱼；最后封栏。',
      },
      {
        speaker: '老园丁',
        text: '一步步来。急不得。',
      },
    ],
  },

  // 复用 clues —— 阶段 1 的"杂物"
  clues: [
    { id: 'd1', name: '落叶', hint: '井沿的落叶。', position: { tx: 4.0, ty: 9.5 } },
    { id: 'd2', name: '碎石', hint: '井口的碎石。', position: { tx: 6.0, ty: 9.5 } },
    { id: 'd3', name: '淤泥', hint: '井壁的淤泥。', position: { tx: 5.0, ty: 8.5 } },
    { id: 'd4', name: '枯枝', hint: '井中的枯枝。', position: { tx: 4.0, ty: 11.0 } },
    { id: 'd5', name: '青苔', hint: '井壁的青苔。', position: { tx: 6.0, ty: 11.0 } },
    { id: 'd6', name: '旧绳', hint: '井沿的旧绳。', position: { tx: 5.0, ty: 12.0 } },
  ],

  debris: [
    { id: 'd1', name: '落叶', icon: '🍂', tx: 4.0, ty: 9.5 },
    { id: 'd2', name: '碎石', icon: '🪨', tx: 6.0, ty: 9.5 },
    { id: 'd3', name: '淤泥', icon: '🟤', tx: 5.0, ty: 8.5 },
    { id: 'd4', name: '枯枝', icon: '🪵', tx: 4.0, ty: 11.0 },
    { id: 'd5', name: '青苔', icon: '🌿', tx: 6.0, ty: 11.0 },
    { id: 'd6', name: '旧绳', icon: '🪢', tx: 5.0, ty: 12.0 },
  ],

  pipes: [
    { id: 'p1', name: '东渠', tx: 8.0, ty: 12.0 },
    { id: 'p2', name: '中渠', tx: 5.0, ty: 12.5 },
    { id: 'p3', name: '西渠', tx: 2.0, ty: 12.0 },
  ],

  targets: [
    { id: 't-flower', name: '花圃', icon: '🌸', tx: 3.5, ty: 11.5, needMin: 2, needMax: 3 },
    { id: 't-tree',   name: '老树', icon: '🌳', tx: 6.0, ty: 12.0, needMin: 3, needMax: 4 },
    { id: 't-fish',   name: '鱼池', icon: '🐟', tx: 8.5, ty: 11.5, needMin: 1, needMax: 2 },
  ],

  coverPieces: [
    { id: 'c1', slotId: 's1' },
    { id: 'c2', slotId: 's2' },
    { id: 'c3', slotId: 's3' },
    { id: 'c4', slotId: 's4' },
  ],

  coverSlots: [
    { id: 's1', x: 430, y: 428 },
    { id: 's2', x: 490, y: 428 },
    { id: 's3', x: 430, y: 488 },
    { id: 's4', x: 490, y: 488 },
  ],
  wellPosition: { tx: 5.0, ty: 10.0 },
  knowledgeCard: {
    title: '园林中的古井',
    content:
      '江南园林里的古井，是"活的循环"——它供水、养鱼、润花木。\n' +
      '但井也需要"照护"：清杂物、滤淤塞、分水匀、封栏护。\n' +
      '园林的智慧不在"造得巧妙"，而在"养得长久"。',
    source: '参考资料：《长物志》、《园冶》（史实复核中）',
  },

  azhuComment: '一眼井的照护，也是一座园子的照护。',
  successTitle: '井水清冽',
  successBody: '杂物尽去，淤塞疏通，甘泉各归其位，井栏稳稳合拢。天井通渠，得一口活水。',
}