import type { RecordEntry, Word } from '../types/study.ts'

export function serializeHistory(
  history: RecordEntry[],
  mistakes: Word[],
  exportedAt: string,
): string {
  return JSON.stringify({ exportedAt, history, mistakes }, null, 2)
}

export function downloadHistory(
  history: RecordEntry[],
  mistakes: Word[],
  today: string,
  onRevoke?: () => void,
) {
  const blob = new Blob([serializeHistory(history, mistakes, new Date().toISOString())], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `听见-学习记录-${today}.json`
  let revoked = false
  const revoke = () => {
    if (revoked) return
    revoked = true
    URL.revokeObjectURL(url)
    onRevoke?.()
  }
  link.click()
  const timer = setTimeout(revoke, 1000)
  return () => {
    clearTimeout(timer)
    revoke()
  }
}
