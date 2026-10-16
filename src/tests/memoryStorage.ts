// sessionStorage em memória para os testes (o Vitest roda em Node, sem navegador).
export class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.has(key) ? (this.data.get(key) as string) : null
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value))
  }
}

export function installSessionStorage(): MemoryStorage {
  const storage = new MemoryStorage()
  ;(globalThis as unknown as { window: { sessionStorage: Storage } }).window = { sessionStorage: storage }
  return storage
}
