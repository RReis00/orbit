type Handler<T = any> = (payload: T) => void

class EventBus {
  private map = new Map<string, Set<Handler>>()

  on<T = any>(event: string, handler: Handler<T>) {
    const set = this.map.get(event) ?? new Set<Handler>()
    set.add(handler as Handler)
    this.map.set(event, set)
    return () => this.off(event, handler)
  }

  off<T = any>(event: string, handler: Handler<T>) {
    const set = this.map.get(event)
    if (!set) return
    set.delete(handler as Handler)
    if (set.size === 0) this.map.delete(event)
  }

  emit<T = any>(event: string, payload: T) {
    const set = this.map.get(event)
    if (!set) return
    for (const h of set) h(payload)
  }
}

export const eventBus = new EventBus()
