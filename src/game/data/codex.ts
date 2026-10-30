
import type { KnowledgeCard, WorldId } from '../types.ts'
/** 一条图鉴记录 */
export type CodexEntry = {
  id: string
  title: string
  worldId: WorldId
  worldName: string
  knowledgeCard: KnowledgeCard
}

/** 所有图鉴（按世界分组排序） */
export const codexEntries: CodexEntry[] = [
  {
    id: 'forbidden-city-hall',
    title: '故宫拾遗',
    worldId: 'forbidden-city',
    worldName: '故宫',
    knowledgeCard: {
      title: '脊兽与殿宇等级',
      content:
        '紫禁城屋顶上的脊兽并非单纯的装饰，而是一套可阅读的等级符号。\n' +
        '太和殿用十只脊兽，是全国唯一"满十"的殿宇；乾清宫九只，坤宁宫七只，\n' +
        '等级依次递减。脊兽的数量、材质与殿顶形式，共同构成一套"礼制语法"。',
      source: '参考资料：《清式营造则例》、《紫禁城建筑图典》（史实复核中）',
    },
  },
  {
    id: 'forbidden-city-ridge-beasts',
    title: '脊兽法式',
    worldId: 'forbidden-city',
    worldName: '故宫',
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
  },
  {
    id: 'forbidden-city-flower-street',
    title: '花街寻吉',
    worldId: 'forbidden-city',
    worldName: '故宫',
    knowledgeCard: {
      title: '花街铺地与吉祥纹样',
      content:
        '紫禁城御花园的花街铺地，用碎砖瓦拼出蝙蝠、鹿、寿桃、喜鹊等吉祥纹样。\n' +
        '这些纹样不只是装饰——它们把"福禄寿喜"的祝愿，\n' +
        '化作脚下的秩序，让每一次行走都踏在吉祥之上。',
      source: '参考资料：《紫禁城御花园铺地研究》（史实复核中）',
    },
  },
  // ★ 新增：苏州拙政园
  {
    id: 'suzhou-cats',
    title: '巷陌寻踪',
    worldId: 'suzhou-garden',
    worldName: '苏州拙政园',
    knowledgeCard: {
      title: '园林中的猫',
      content:
        '江南园林不只是山水亭台——它也是"人、植物、动物"共生的空间。\n' +
        '猫在园中是"活的风景"——它们自由穿行于廊、池、花、石之间，\n' +
        '让"人工的秩序"生出"自然的野趣"。\n' +
        '园林的智慧，在于"为万物留出安居的余地"。',
      source: '参考资料：《江南园林志》、《园冶》（史实复核中）',
    },
  },
    {
    id: 'suzhou-fish',
    title: '池畔逐影',
    worldId: 'suzhou-garden',
    worldName: '苏州拙政园',
    knowledgeCard: {
      title: '园林中的锦鲤',
      content:
        '江南园林的水池多养锦鲤。锦鲤不只是观赏——它们"动水"、\n' +
        '净水，是"活的水循环"的一部分。\n' +
        '喂食讲"分寸"：过多则水质恶化，过少则鱼体消瘦。\n' +
        '园林的照护，是"和自然共处"的智慧——不是支配，而是"配合"。',
      source: '参考资料：《长物志》、《园冶》（史实复核中）',
    },
  },
    {
    id: 'suzhou-goose',
    title: '水岸清羽',
    worldId: 'suzhou-garden',
    worldName: '苏州拙政园',
    knowledgeCard: {
      title: '园林中的白鹅',
      content:
        '江南园林中养鹅，不只是观赏——鹅"驱蛇"、"清草"、\n' +
        '也让水面"活"起来。\n' +
        '照护白鹅有讲究：先清环境，再洗身；洗时避开头部，\n' +
        '梳毛要"顺向"，擦干要"轻按"。\n' +
        '园林的"共生"，是"顺着它的习性照料"，不是"按人的方便来"。',
      source: '参考资料：《长物志》、《园冶》（史实复核中）',
    },
  },
    {
    id: 'suzhou-well',
    title: '天井通渠',
    worldId: 'suzhou-garden',
    worldName: '苏州拙政园',
    knowledgeCard: {
      title: '园林中的古井',
      content:
        '江南园林里的古井，是"活的循环"——它供水、养鱼、润花木。\n' +
        '但井也需要"照护"：清杂物、滤淤塞、分水匀、封栏护。\n' +
        '园林的智慧不在"造得巧妙"，而在"养得长久"。',
      source: '参考资料：《长物志》、《园冶》（史实复核中）',
    },
  },
    {
    id: 'yingxian-timber',
    title: '良材甄选',
    worldId: 'yingxian-pagoda',
    worldName: '应县木塔',
    knowledgeCard: {
      title: '木材与构件',
      content:
        '应县木塔用"松、柏、杉、榆、楠、柞"等多种木材。\n' +
        '"柱"需"直且耐腐"——多用松、柏；\n' +
        '"梁"需"韧而轻"——多用杉、榆；\n' +
        '"斗拱"需"细而密"——多用楠、柞。\n' +
        '不同构件承担不同"受力角色"，选材也各有讲究。',
      source: '参考资料：《营造法式》、《应县木塔》（史实复核中）',
    },
  },
    {
    id: 'yingxian-dougong',
    title: '斗拱落棒',
    worldId: 'yingxian-pagoda',
    worldName: '应县木塔',
    knowledgeCard: {
      title: '斗拱与榫卯',
      content:
        '应县木塔全塔用"榫卯"咬合，无一枚铁钉。\n' +
        '"斗拱"层层叠叠，每层"斗"与"拱"相互咬合——\n' +
        '受力时，层层分散；地震时，层层"退让"，反而不易断裂。\n' +
        '榫卯的智慧，是"不靠钉子硬咬，而靠形状相和"。',
      source: '参考资料：《营造法式》、《应县木塔》（史实复核中）',
    },
  },
    {
    id: 'yingxian-stacking',
    title: '层叠筑塔',
    worldId: 'yingxian-pagoda',
    worldName: '应县木塔',
    knowledgeCard: {
      title: '木塔的层叠',
      content:
        '应县木塔底层，由"基底 → 柱 → 梁 → 斜撑"逐层组成。\n' +
        '每一层都"依赖"前一层——\n' +
        '基底不稳，柱必斜；柱不直，梁必偏；梁不平，斜撑必松。\n' +
        '木构的"层叠"，是"相互依赖"层层成立——\n' +
        '不是"堆叠"，而是"彼此成全"。',
      source: '参考资料：《营造法式》、《应县木塔》（史实复核中）',
    },
  },
    {
    id: 'yingxian-load',
    title: '荷载校验',
    worldId: 'yingxian-pagoda',
    worldName: '应县木塔',
    knowledgeCard: {
      title: '木塔的荷载',
      content:
        '木塔的"荷载"不只是"自身重量"，也包括"人、风、雪"。\n' +
        '如果"局部过载"，木构会变形；如果"均匀受力"，结构就稳固。\n' +
        '古人的"疏导智慧"——让"多的人"往"少的地方"走，\n' +
        '就是"结构平衡"的实践。',
      source: '参考资料：《营造法式》、《应县木塔》（史实复核中）',
    },
  },
    {
    id: 'egypt-mural',
    title: '残破壁画',
    worldId: 'egypt-pyramid',
    worldName: '埃及金字塔',
    knowledgeCard: {
      title: '古埃及象形文字',
      content:
        '古埃及壁画上的符号不只是"装饰"——它们是一套"可读的文字系统"。\n' +
        '"荷鲁斯之眼"象征保护与治愈；"安卡"象征生命；"圣甲虫"象征重生。\n' +
        '这些符号与法老的权力、宗教仪式、星辰崇拜紧密相关。',
      source: '参考资料：《埃及亡灵书》（史实复核中）',
    },
  },
    {
    id: 'egypt-spot',
    title: '文明破译',
    worldId: 'egypt-pyramid',
    worldName: '埃及金字塔',
    knowledgeCard: {
      title: '祭祀壁画的细节',
      content:
        '古埃及祭祀壁画中的每一个细节都有象征意义。\n' +
        '太阳的大小象征神威的强弱；飞鸟象征灵魂的升降；\n' +
        '权杖的弯曲象征法老与神权的联系；\n' +
        '花卉的颜色象征季节与祭祀；圣甲虫的位置象征重生。',
      source: '参考资料：《埃及亡灵书》（史实复核中）',
    },
  },
    {
    id: 'egypt-stealth',
    title: '甬道躲避',
    worldId: 'egypt-pyramid',
    worldName: '埃及金字塔',
    knowledgeCard: {
      title: '金字塔的内部',
      content:
        '金字塔内部是巨大的迷宫，由狭窄的甬道和墓室组成。\n' +
        '为了防盗墓贼，古人设计了复杂的通道、暗门，\n' +
        '以及传说中的“法老诅咒”。\n' +
        '在古埃及的信仰中，阿努比斯（胡狼头神）是亡灵的向导，也是陵墓的守护者。',
      source: '参考资料：《金字塔铭文》（史实复核中）',
    },
  },
    {
    id: 'egypt-final',
    title: '密室寻宝',
    worldId: 'egypt-pyramid',
    worldName: '埃及金字塔',
    knowledgeCard: {
      title: '古埃及的智慧',
      content:
        '古埃及人将智慧藏于星辰、几何与神话之中。\n' +
        '符文代表秩序，星象代表时间，通道代表抉择，圣符代表信仰。\n' +
        '四者合一，构成了他们对宇宙的理解。',
      source: '参考资料：《金字塔铭文》（史实复核中）',
    },
  },
    {
    id: 'petra-path',
    title: '红岩蛇道',
    worldId: 'petra',
    worldName: '佩特拉古城',
    knowledgeCard: {
      title: '佩特拉的蛇道',
      content:
        '佩特拉古城隐藏在约旦的群山之中。进入古城的唯一通道是一条名为“蛇道”（Al-Siq）的狭窄峡谷。\n' +
        '峡谷最窄处仅容两人并行，两侧岩壁高达百米。\n' +
        '古人利用这里的地形，修建了水渠和水利系统，并设下重重机关，保护这座“玫瑰之城”。',
      source: '参考资料：《佩特拉古城考古报告》（史实复核中）',
    },
  },
    {
    id: 'petra-camel',
    title: '荒漠商旅',
    worldId: 'petra',
    worldName: '佩特拉古城',
    knowledgeCard: {
      title: '佩特拉的商路',
      content:
        '佩特拉曾是古代纳巴泰人的首都，也是连接中国、印度、阿拉伯与罗马的香料之路的枢纽。\n' +
        '商队带着乳香、没药、丝绸和香料，穿过严酷的沙漠峡谷。\n' +
        '为了在荒漠中生存，古人修建了庞大的水渠和蓄水池。',
      source: '参考资料：《佩特拉商路史》（史实复核中）',
    },
  },
    {
    id: 'petra-canal',
    title: '岩壁古渠',
    worldId: 'petra',
    worldName: '佩特拉古城',
    knowledgeCard: {
      title: '佩特拉的水利系统',
      content:
        '佩特拉身处沙漠，年降雨量极少，却曾养育了数万人。\n' +
        '纳巴泰人利用岩壁的坡度，修建了错综复杂的水渠、水坝和陶管。\n' +
        '他们能收集冬季的暴洪，过滤泥沙，再将珍贵的水分配到不同的神庙、住宅和花园。\n' +
        '水，就是这座城的信仰。',
      source: '参考资料：《佩特拉水网考古》（史实复核中）',
    },
  },
    {
    id: 'petra-water',
    title: '荒漠生机',
    worldId: 'petra',
    worldName: '佩特拉古城',
    knowledgeCard: {
      title: '纳巴泰人的水利',
      content:
        '佩特拉的水利系统是古代世界的奇迹。\n' +
        '他们利用岩壁的倾斜，修建了复杂的引水渠。在暴雨时，巨大的暗渠能将洪水导走，避免城池被淹；\n' +
        '在干旱时，密封的陶管和蓄水池能锁住每一滴水。\n' +
        '正是这种对水的极致掌控，让玫瑰古城在沙漠中繁荣了数百年。',
      source: '参考资料：《佩特拉水利与建筑》（史实复核中）',
    },
  },
    {
    id: 'dome-wall',
    title: '八面圣墙',
    worldId: 'dome-rock',
    worldName: '圆顶清真寺',
    knowledgeCard: {
      title: '伊斯兰几何纹样',
      content:
        '圆顶清真寺（Dome of the Rock）的墙面装饰着极其精美的几何纹样。\n' +
        '由于伊斯兰教传统不鼓励具象的人物或动物崇拜，艺术家们发展出了极其复杂的几何与植物纹样（Arabesque）。\n' +
        '八角形、星形、无限延伸的线条，象征着安拉的无限与宇宙的秩序。',
      source: '参考资料：《伊斯兰建筑艺术》（史实复核中）',
    },
  },
]

/** 按世界分组 */
export function codexByWorld(): Map<string, CodexEntry[]> {
  const map = new Map<string, CodexEntry[]>()
  for (const entry of codexEntries) {
    const list = map.get(entry.worldName) ?? []
    list.push(entry)
    map.set(entry.worldName, list)
  }
  return map
}