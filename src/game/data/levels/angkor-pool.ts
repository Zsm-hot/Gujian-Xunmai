import type { LevelConfig } from '../../types.ts'

export const angkorPoolLevel: LevelConfig = {
  id: 'angkor-pool',
  worldId: 'angkor',
  title: '四方圣池',
  chapter: '寻脉其七 · 其二',
  objective: '通过点击四方轨道的合格水格，维持圣池水量的平衡',
  npc: {
    id: 'khmer-keeper',
    name: '高棉壁画守巷人',
    title: '回廊守护者',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '高棉壁画守巷人', text: '圣池养育了帝国，但水流的分配必须绝对平衡。' },
      { speaker: '高棉壁画守巷人', text: '金水能增加水位，洪水会引发失衡，泥沙会堵塞池底。' },
      { speaker: '高棉壁画守巷人', text: '看准落下的水格，精准点击，不要误触。' },
    ],
  },
  clues: [],
  knowledgeCard: {
    title: '吴哥窟的水利系统',
    content: '吴哥窟拥有极其复杂的水利网络，包括蓄水池、护城河和纵横交错的沟渠。这些水利系统不仅用于农业灌溉，也象征着印度神话中环绕须弥山的海洋。',
    source: '参考资料：《吴哥水利》',
  },
  azhuComment: '水能载舟，亦能覆舟，平衡才是自然的法则。',
  successTitle: '四水调和',
  successBody: '四方圣池的水位渐渐持平，古老的圣池再次焕发了生机。',
}