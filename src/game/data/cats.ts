export type CatConfig = {
  worldId: string
  name: string
  breed: string
  poem: string
  imageKey: string // 对应的图片资源名称
}

export const CATS: Record<string, CatConfig> = {
  'forbidden-city': { worldId: 'forbidden-city', name: '玄狸', breed: '玄色狸花猫', poem: '红墙藏岁月，狸猫识宫章。', imageKey: 'cat-gugong' },
  'suzhou-garden': { worldId: 'suzhou-garden', name: '橘猫', breed: '短毛大橘', poem: '一池荷风起，橘卧江南亭。', imageKey: 'cat-suzhou' },
  'yingxian-pagoda': { worldId: 'yingxian-pagoda', name: '辽猫', breed: '银虎斑长毛田园猫', poem: '一木承千载，狸守辽时塔。', imageKey: 'cat-yingxian' },
  'egypt-pyramid': { worldId: 'egypt-pyramid', name: '法老黑猫', breed: '纯黑短毛猫', poem: '黄沙埋古秘，黑喵伴法老。', imageKey: 'cat-egypt' },
  'petra': { worldId: 'petra', name: '沙沙', breed: '沙漠沙猫', poem: '红岩藏幽谷，沙猫踏风来。', imageKey: 'cat-petra' },
  'dome-rock': { worldId: 'dome-rock', name: '云遥', breed: '纯白短毛猫', poem: '金顶映天光，白猫守平和。', imageKey: 'cat-dome' },
  'angkor': { worldId: 'angkor', name: '暹暹', breed: '浅棕重点色暹罗猫', poem: '树根缠石殿，暹影入雨林。', imageKey: 'cat-angkor' },
  'machu-picchu': { worldId: 'machu-picchu', name: '云斑', breed: '安第斯云雾虎斑猫', poem: '山云漫古岭，斑古建寻脉。', imageKey: 'cat-machu' },
}