/**
 * 关卡完成状态（localStorage）
 * key: gujian-xunmai:completed:<levelId>  → "true"
 */
export class LevelProgress {
  private static PREFIX = 'gujian-xunmai:completed:'

  static markCompleted(levelId: string) {
    try {
      localStorage.setItem(this.PREFIX + levelId, 'true')
    } catch (e) {
      console.warn('[LevelProgress] 写入失败', e)
    }
  }

  static isCompleted(levelId: string): boolean {
    try {
      return localStorage.getItem(this.PREFIX + levelId) === 'true'
    } catch {
      return false
    }
  }

  static reset(levelId: string) {
    try {
      localStorage.removeItem(this.PREFIX + levelId)
    } catch { /* ignore */ }
  }

  /** 统计某世界已通关卡数 */
  static countCompleted(levelIds: string[]): number {
    return levelIds.filter((id) => this.isCompleted(id)).length
  }
}