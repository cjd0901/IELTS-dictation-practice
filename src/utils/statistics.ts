import type { RecordEntry } from '../types/study.ts'

export const localDateKey = (date: Date) => date.toLocaleDateString('en-CA')

export function getLearningStats(history: RecordEntry[], today: string) {
  const practiced = history.reduce((total, entry) => total + entry.words.length, 0)
  const todayCount = history
    .filter((entry) => localDateKey(new Date(entry.date)) === today)
    .reduce((total, entry) => total + entry.words.length, 0)
  const accuracy = history.length
    ? Math.round((history.reduce((total, entry) => total + entry.correct, 0) / practiced) * 100)
    : 0
  return { practiced, todayCount, accuracy }
}
