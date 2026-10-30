/**
 * 关卡进度状态机
 * 负责记录已收集的线索，并持久化到 localStorage。
 * 每个关卡用 levelId 作为存储 key，互不干扰。
 */
export class QuestProgress {
  private readonly collected = new Set<string>()
  private readonly clueIds: readonly string[]
  private readonly storageKey: string

  /**
   * @param levelId 关卡唯一 ID（用于 localStorage 的 key）
   * @param clueIds 该关卡所有线索的 ID
   */
  constructor(levelId: string, clueIds: readonly string[]) {
    this.clueIds = clueIds
    this.storageKey = `gujian-xunmai:progress:${levelId}`
    this.load()
  }

  /** 从 localStorage 恢复进度 */
  private load() {
    try {
      const raw = localStorage.getItem(this.storageKey)
      if (!raw) return
      const saved = JSON.parse(raw) as string[]
      if (!Array.isArray(saved)) return
      for (const id of saved) {
        if (this.clueIds.includes(id)) {
          this.collected.add(id)
        }
      }
    } catch (err) {
      console.warn('[QuestProgress] 读取存档失败，忽略：', err)
    }
  }

  /** 把当前进度写入 localStorage */
  private save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([...this.collected]))
    } catch (err) {
      console.warn('[QuestProgress] 写入存档失败，忽略：', err)
    }
  }

  /** 收集一个线索，成功返回 true，已存在或非法 ID 返回 false */
  collect(id: string) {
    if (!this.clueIds.includes(id) || this.collected.has(id)) {
      return false
    }
    this.collected.add(id)
    this.save()
    return true
  }
  /** 判断某个线索是否已经被收集 */
  isCollected(id: string): boolean {
    return this.collected.has(id)
  }
  count() {
    return this.collected.size
  }

  total() {
    return this.clueIds.length
  }

  isComplete() {
    return this.clueIds.every((id) => this.collected.has(id))
  }

  /** 清空本关进度（调试用，或在"重新开始"按钮里调用） */
  reset() {
    this.collected.clear()
    try {
      localStorage.removeItem(this.storageKey)
    } catch (err) {
      console.warn('[QuestProgress] 清除存档失败，忽略：', err)
    }
  }
}