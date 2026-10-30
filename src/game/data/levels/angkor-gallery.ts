import type { LevelConfig } from '../../types.ts'

export const angkorGalleryLevel: LevelConfig = {
  id: 'angkor-gallery',
  worldId: 'angkor',
  title: '八百回廊',
  chapter: '寻脉其七 · 其一',
  objective: '复原残破浮雕，重排史诗次序，纠正岁月侵蚀的错误',
  npc: {
    id: 'khmer-keeper',
    name: '高棉壁画守巷人',
    title: '回廊守护者',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '高棉壁画守巷人', text: '石头记录了神话与王权，但也抵不过千年的风雨。' },
      { speaker: '高棉壁画守巷人', text: '你看这墙上，搅拌乳海的众神已经错位，阿普萨拉仙女的舞姿也被岁月磨去。' },
      { speaker: '高棉壁画守巷人', text: '请帮我修补残缺，让这八百回廊的史诗重新流转。' },
    ],
  },
  clues: [],
  knowledgeCard: {
    title: '吴哥窟的回廊史诗',
    content: '吴哥窟的回廊长达数百米，墙壁上布满精美的浮雕。这些浮雕记录了印度史诗《摩诃婆罗多》《罗摩衍那》的故事，以及苏利耶跋摩二世国王的功绩。它们不仅是艺术珍品，更是石头上刻下的历史。',
    source: '参考资料：《吴哥之美》',
  },
  azhuComment: '原来石头也会说话，只要你用心去听它的伤痕。',
  successTitle: '回廊重现',
  successBody: '尘封的史诗再次流转，高棉的微笑在阳光下显得更加深邃。',
}