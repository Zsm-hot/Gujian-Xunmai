import type { LevelConfig } from '../../types.ts'

export const angkorBoatLevel: LevelConfig = {
  id: 'angkor-boat',
  worldId: 'angkor',
  title: '环城水雾',
  chapter: '寻脉其七 · 其三',
  objective: '驾驶木船穿越护城河，避开暗桩，寻找阿普萨拉仙女',
  npc: {
    id: 'khmer-keeper',
    name: '高棉壁画守巷人',
    title: '回廊守护者',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '高棉壁画守巷人', text: '护城河上起了大雾，水里还有暗桩。' },
      { speaker: '高棉壁画守巷人', text: '请驾驶木船穿过迷雾，找到阿普萨拉仙女。' },
    ],
  },
  clues: [],
  knowledgeCard: {
    title: '吴哥窟的护城河',
    content: '吴哥窟的护城河不仅是一道防御工事，更象征着环绕须弥山的咸海。在旱季，护城河也为庞大的城市提供了重要的生活用水和农业灌溉。',
    source: '参考资料：《吴哥水利》',
  },
  azhuComment: '迷雾虽大，但心向光明。',
  successTitle: '雾散见真',
  successBody: '你驾驶木船穿过了重重迷雾，吴哥的护城河再次见证了你的勇气。',
}