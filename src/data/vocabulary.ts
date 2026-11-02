import vocabulary from '../vocabulary.json' with { type: 'json' }
import type { Word } from '../types/study.ts'

export const GROUP_SIZE = 20
export const CHAPTERS = Object.fromEntries(
  Object.entries(vocabulary).map(([chapter, words]) => [
    chapter,
    words.map((word, index) => ({ ...word, id: `${chapter}:${index}` })),
  ]),
) as Record<string, Word[]>
export const TOTAL = Object.values(CHAPTERS).reduce((sum, words) => sum + words.length, 0)

export function chapterTitle(id: string): string {
  if (id.startsWith('3')) return '第 3 章 · 名词'
  if (id.startsWith('4')) return '第 4 章 · 形容词与副词'
  if (id.startsWith('5')) return '第 5 章 · 短语'
  return '第 11 章 · 综合词汇'
}

export function chapterSubtitle(id: string): string {
  if (id.includes('.2') && !id.startsWith('11')) return '基础词汇'
  return id.startsWith('11') ? '综合巩固' : '进阶词汇'
}
