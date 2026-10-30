import type { LevelConfig } from '../../types.ts'

export const machuSpotLevel: LevelConfig = {
  id: 'machu-spot',
  worldId: 'machu-picchu',
  title: '地质勘探',
  chapter: '寻脉其八 · 其一',
  objective: '在云端山城巡视，找出四类隐藏的地质隐患',
  npc: {
    id: 'inca-guardian',
    name: '印加守山卫士',
    title: '山城守护者',
    position: { tx: 0, ty: 0 },
    dialogue: [
      { speaker: '印加守山卫士', text: '山城的石墙虽然坚固，但大地却在呼吸。' },
      { speaker: '印加守山卫士', text: '岩层裂隙、松散坡土、堵塞的暗渠……如果不及时发现，山城就会崩塌。' },
      { speaker: '印加守山卫士', text: '请用勘探镜仔细巡视，找出四类隐患。' },
    ],
  },
  clues: [],
  knowledgeCard: {
    title: '马丘比丘的排水与地质',
    content: '马丘比丘建在断层带上，印加人极其聪明地建造了复杂的暗渠排水系统。他们还使用“干砌石”技术，让石块在地震时能自行微调。',
    source: '参考资料：《印加建筑与安第斯地理》',
  },
  azhuComment: '顺应山势，才是真正的生存智慧。',
  successTitle: '勘察完毕',
  successBody: '地质隐患已被标记，山城暂时脱离了危险。',
}