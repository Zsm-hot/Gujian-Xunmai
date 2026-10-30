import type { LevelConfig } from '../../types.ts'

export const petraCamelLevel: LevelConfig = {
  id: 'petra-camel',
  worldId: 'petra',
  title: '荒漠商旅',
  chapter: '寻脉其五 · 其二',
  objective: '操控骆驼避障，安全抵达驿站',

  npc: {
    id: 'desert-guide',
    name: '沙漠先民',
    title: '古道向导',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '沙漠先民', text: '商队要穿过这片荒漠。但流沙和倒塌的石柱，随时会吞没人和货物。' },
      { speaker: '沙漠先民', text: '按空格键（或点屏幕）让骆驼跳起来。别撞上障碍。' },
      { speaker: '沙漠先民', text: '货物和耐力都要保住，否则到不了驿站。' },
    ],
  },

  clues: [
    { id: 'c1', name: '驿站', hint: '终点', position: { tx: 0, ty: 0 } },
  ],

  knowledgeCard: {
    title: '佩特拉的商路',
    content:
      '佩特拉曾是古代纳巴泰人的首都，也是连接中国、印度、阿拉伯与罗马的香料之路的枢纽。\n' +
      '商队带着乳香、没药、丝绸和香料，穿过严酷的沙漠峡谷。\n' +
      '为了在荒漠中生存，古人修建了庞大的水渠和蓄水池。',
    source: '参考资料：《佩特拉商路史》（史实复核中）',
  },

  azhuComment: '穿越荒漠的商队，是古代世界最勇敢的冒险者。',
  successTitle: '抵达驿站',
  successBody: '骆驼长鸣一声，商队终于踏进了绿洲驿站。货物完好，人驼皆安。',
}