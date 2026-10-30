import type { LevelConfig } from '../../types.ts'
import { courtyardLevel } from './courtyard.ts'

const levels: Record<string, LevelConfig> = {
  [courtyardLevel.id]: courtyardLevel,
}

export function getLevel(id: string): LevelConfig {
  const level = levels[id]
  if (!level) {
    throw new Error(`未找到关卡配置：${id}`)
  }
  return level
}

export function getPlayableLevelId() {
  return courtyardLevel.id
}
