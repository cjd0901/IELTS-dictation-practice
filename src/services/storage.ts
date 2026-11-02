// Storage keys and JSON payloads are a compatibility boundary for existing users.
const PREFIX = 'tingjian:'

export function load<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(`${PREFIX}${key}`)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
