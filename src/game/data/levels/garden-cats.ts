import type { CatLevelConfig } from '../../types.ts'

export const gardenCatsLevel: CatLevelConfig = {
  id: 'suzhou-cats',
  worldId: 'suzhou-garden',
  title: '巷陌寻踪',
  chapter: '寻脉其二 · 其一',
  objective: '循着猫的脚印，找到园中的猫',

  npc: {
    id: 'old-gardener',
    name: '老园丁',
    title: '守园人',
    position: { tx: -1.5, ty: 6.5 },   // ★ 月洞门内，避开脚印
    dialogue: [
      {
        speaker: '老园丁',
        text: '这座园子里住着一只猫。它白天藏在各处，夜里才出来。',
      },
      {
        speaker: '老园丁',
        text: '你若仔细看——石板上、回廊里、花丛边，会留下它的脚印。',
      },
      {
        speaker: '老园丁',
        text: '顺着脚印走，找到它，也就读懂了这座院子。',
      },
    ],
  },

  clues: [
    { id: 'paw-1', name: '墙根的脚印', hint: '月洞门旁留着一串。', position: { tx: 0.25, ty: 8.0 } },
    { id: 'paw-2', name: '水边的脚印', hint: '水边抓鱼。', position: { tx: 2.9, ty: 9.45 } },
    { id: 'paw-3', name: '桥上的脚印', hint: '桥上走过。', position: { tx: 5.46, ty: 7.35 } },
    { id: 'paw-4', name: '假山上的脚印', hint: '水中央的假山。', position: { tx: 9.14, ty: 4.42 } },
    { id: 'paw-5', name: '花树下的脚印', hint: '花瓣被拨动。', position: { tx: 14.32, ty: 5.84 } },
  ],

  pawPrints: [
    {
      id: 'paw-1',
      name: '墙根的脚印',
      hint: '月洞门旁留着一串。',
      position: { tx: 0.25, ty: 8.0 },
      whisper: '月洞门旁，有一串湿湿的脚印……',
    },
    {
      id: 'paw-2',
      name: '水边的脚印',
      hint: '水边抓鱼。',
      position: { tx: 2.9, ty: 9.45 },
      whisper: '它到水边来过。',
    },
    {
      id: 'paw-3',
      name: '桥上的脚印',
      hint: '桥上走过。',
      position: { tx: 5.46, ty: 7.35 },
      whisper: '它从桥上过去了。',
    },
    {
      id: 'paw-4',
      name: '假山上的脚印',
      hint: '水中央的假山。',
      position: { tx: 9.14, ty: 4.42 },
      whisper: '它跳到假山上了……',
    },
    {
      id: 'paw-5',
      name: '花树下的脚印',
      hint: '花瓣被拨动。',
      position: { tx: 14.32, ty: 5.84 },
      whisper: '花瓣被拨开了……就快到了。',
    },
  ],

  cats: [{ tx: 14.6, ty: 6.2 }],

  knowledgeCard: {
    title: '园林中的猫',
    content:
      '江南园林不只是山水亭台——它也是"人、植物、动物"共生的空间。\n' +
      '猫在园中是"活的风景"——它们自由穿行于廊、池、花、石之间，\n' +
      '让"人工的秩序"生出"自然的野趣"。\n' +
      '园林的智慧，在于"为万物留出安居的余地"。',
    source: '参考资料：《江南园林志》、《园冶》（史实复核中）',
  },

  azhuComment: '园林不是把自然关进院墙，而是给万物留出彼此安居的余地。',
  successTitle: '猫影寻踪',
  successBody: '循着脚印，它在花树旁现身。或卧或行，与这座园子相安。',
}