import type { LevelConfig } from '../../types.ts'

export const machuQuarryLevel: LevelConfig = {
  id: 'machu-quarry',
  worldId: 'machu-picchu',
  title: '采石修城',
  chapter: '寻脉其八 · 其三',
  objective: '挑选完整石材，蓄力将其精准推入城墙缺口',
  npc: {
    id: 'inca-guardian',
    name: '印加守山卫士',
    title: '山城守护者',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '印加守山卫士', text: '城墙被震裂了缺口，我们需要巨石来填补。' },
      { speaker: '印加守山卫士', text: '但山道崎岖，推力太小石头推不上去，推力太大又会滚落悬崖。' },
      { speaker: '印加守山卫士', text: '请挑选最完美的石材，精准地推入缺口吧！' },
    ],
  },
  clues: [],
  knowledgeCard: {
    title: '印加干砌石墙',
    content: '马丘比丘的建筑使用了“干砌石”技术，不使用任何灰浆。工匠们将巨大的石块打磨得极其精密，使得石块之间严丝合缝，甚至连一张纸都插不进去。这种结构在地震时能轻微晃动而不会倒塌。',
    source: '参考资料：《印加石构建筑技术》',
  },
  azhuComment: '严丝合缝，不仅是技术，更是对山神的敬畏。',
  successTitle: '城墙修复',
  successBody: '巨石完美嵌入缺口，印加山城再次坚不可摧。',
}