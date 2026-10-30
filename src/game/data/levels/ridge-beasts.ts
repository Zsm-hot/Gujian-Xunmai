import type { RidgeBeastLevel } from '../../types.ts'

/** 太和殿脊兽的正确排序（从前到后） */
const CORRECT_ORDER = [
  { slotId: 's1', itemId: 'long',   label: '龙' },
  { slotId: 's2', itemId: 'feng',   label: '凤' },
  { slotId: 's3', itemId: 'shi',    label: '狮' },
  { slotId: 's4', itemId: 'tianma', label: '天马' },
  { slotId: 's5', itemId: 'haima',  label: '海马' },
  { slotId: 's6', itemId: 'suanni', label: '狻猊' },
  { slotId: 's7', itemId: 'yayu',   label: '押鱼' },
  { slotId: 's8', itemId: 'xiezhi', label: '獬豸' },
  { slotId: 's9', itemId: 'houdou', label: '斗牛' },
  { slotId: 's10', itemId: 'hangshi', label: '行什' },
]

/** 十只脊兽的信息（加入 image 字段） */
const BEASTS = [
  { 
    id: 'long',    
    label: '龙',   
    hint: '龙——象征帝王，居首',
    image: '/assets/beasts/long.png' 
  },
  { 
    id: 'feng',    
    label: '凤',   
    hint: '凤——象征祥瑞，居次',
    image: '/assets/beasts/feng.png' 
  },
  { 
    id: 'shi',     
    label: '狮',   
    hint: '狮——象征威武',
    image: '/assets/beasts/shi.png' 
  },
  { 
    id: 'tianma',  
    label: '天马', 
    hint: '天马——象征威德通天',
    image: '/assets/beasts/tianma.png' 
  },
  { 
    id: 'haima',   
    label: '海马', 
    hint: '海马——象征威德入海',
    image: '/assets/beasts/haima.png' 
  },
  { 
    id: 'suanni',  
    label: '狻猊', 
    hint: '狻猊——象征护佑',
    image: '/assets/beasts/suanni.png' 
  },
  { 
    id: 'yayu',    
    label: '押鱼', 
    hint: '押鱼——象征灭火防灾',
    image: '/assets/beasts/yayu.png' 
  },
  { 
    id: 'xiezhi',  
    label: '獬豸', 
    hint: '獬豸——象征公正',
    image: '/assets/beasts/xiezhi.png' 
  },
  { 
    id: 'houdou',  
    label: '斗牛', 
    hint: '斗牛——象征镇水',
    image: '/assets/beasts/houdou.png' 
  },
  { 
    id: 'hangshi', 
    label: '行什', 
    hint: '行什——象征雷神，殿宇唯一',
    image: '/assets/beasts/hangshi.png' 
  },
]

/** 打乱后的脊兽顺序（玩家看到的初始顺序） */
const SHUFFLED = [
  'suanni', 'long', 'xiezhi', 'feng', 'haima',
  'shi', 'hangshi', 'tianma', 'houdou', 'yayu',
]

export const ridgeBeastLevel: RidgeBeastLevel = {
  id: 'forbidden-city-ridge-beasts',
  worldId: 'forbidden-city',
  title: '脊兽法式',
  chapter: '寻脉其一 · 其二',
  objective: '按十只脊兽等级为殿宇上的脊兽排序',
  npc: {
    id: 'tai-shi',
    name: '紫禁守礼太史',
    title: '守礼太史',
    position: { tx: 0, ty: 0 },
    dialogue: [
      {
        speaker: '紫禁守礼太史',
        text: '太和殿檐角，十只脊兽依次排列。它们不是装饰，而是一套"礼制语法"。',
      },
      {
        speaker: '紫禁守礼太史',
        text: '龙为首，凤次之，狮子、天马、海马、狻猊、押鱼、獬豸、斗牛、行什依序而下。',
      },
      {
        speaker: '紫禁守礼太史',
        text: '把它们放回正确的顺序吧。',
      },
    ],
  },
  items: SHUFFLED.map((id) => BEASTS.find((b) => b.id === id)!),
  slots: CORRECT_ORDER.map((s) => ({
    id: s.slotId,
    label: `第${s.slotId.replace('s', '')}脊`,
  })),
  answer: CORRECT_ORDER.map((s) => s.itemId),
  knowledgeCard: {
    title: '脊兽的排列与等级',
    content:
      '紫禁城屋顶脊兽的排列遵循严格的等级。\n' +
      '太和殿（金銮殿）是唯一满十的殿宇：龙、凤、狮、天马、海马、\n' +
      '狻猊、押鱼、獬豸、斗牛、行什。\n' +
      '乾清宫九只，坤宁宫七只，等级依次递减。\n' +
      '脊兽的数量与排列，共同构成一套"礼制语法"。',
    source: '参考资料：《清式营造则例》（史实复核中）',
  },
  azhuComment:
    '礼制不在别处——它就在这十只小兽的依次排列里。',
  successTitle: '脊兽归位',
  successBody:
    '十只脊兽依次排列，檐角的秩序重新被读出。太史点头："你读懂了这座殿的语言。"',
}