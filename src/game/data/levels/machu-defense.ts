import type { LevelConfig } from '../../types.ts'

export const machuDefenseLevel: LevelConfig = {
  id: 'machu-defense',
  worldId: 'machu-picchu',
  title: '云端天险',
  chapter: '寻脉其八 · 其二',
  objective: '利用落石与滚木机关，阻止入侵者抵达主城入口',
  npc: {
    id: 'inca-guardian',
    name: '印加守山卫士',
    title: '山城守护者',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '印加守山卫士', text: '有外敌试图从山道潜入主城！' },
      { speaker: '印加守山卫士', text: '利用山势，在他们靠近前触发机关。' },
      { speaker: '印加守山卫士', text: '绝对不能让他们越过最后一道防线！' },
    ],
  },
  clues: [],
  knowledgeCard: {
    title: '印加军事防御',
    content: '马丘比丘不仅是宗教与农业中心，也是具有军事防御性质的堡垒。其城墙、阶梯和狭窄的隘口构成了天然的防守优势，配合石块滚木等机关，易守难攻。',
    source: '参考资料：《印加帝国的军事与防御》',
  },
  azhuComment: '借山之威，护城之安。',
  successTitle: '山城无恙',
  successBody: '入侵者被击退，印加山城依旧静谧地矗立在云端。',
}