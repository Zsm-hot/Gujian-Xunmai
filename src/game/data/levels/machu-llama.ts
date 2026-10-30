import type { LevelConfig } from '../../types.ts'

export const machuLlamaLevel: LevelConfig = {
  id: 'machu-llama',
  worldId: 'machu-picchu',
  title: '羊驼牧场',
  chapter: '寻脉其八 · 其四',
  objective: '规划围栏安全区，精准投放草料，并动态巡视防止羊驼坠落。',
  npc: {
    id: 'inca-guardian',
    name: '印加守山卫士',
    title: '山城守护者',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '印加守山卫士', text: '羊驼是我们的珍宝，但梯田边缘就是万丈悬崖。' },
      { speaker: '印加守山卫士', text: '它们会为了抢草料到处乱跑，甚至会试探围栏的缺口。' },
      { speaker: '印加守山卫士', text: '请封堵悬崖、分层投喂，并在最后30秒的混乱中守住它们！' },
    ],
  },
  clues: [],
  knowledgeCard: {
    title: '印加与羊驼',
    content: '羊驼在印加文明中至关重要，不仅是重要的驮兽，其毛发用于纺织，粪便用于肥料。印加人建造了特殊的梯田牧场，并有着严格的放牧管理制度。',
    source: '参考资料：《印加帝国农业与畜牧》',
  },
  azhuComment: '万物有灵，尊重它们的习性，才能与自然和谐共处。',
  successTitle: '牧歌悠扬',
  successBody: '夕阳下，羊驼群在安全的梯田上安静地吃草，山城生活依旧祥和。',
}