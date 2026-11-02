import type { Session, Word } from '../types/study.ts'

export const normalize = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/, '')

export function isCorrect(answer: string, word: Word): boolean {
  if (!answer.trim()) return false
  return [word.w, ...word.w.split(/\s*(?:=|／|\/)\s*/)].some(
    (value) => normalize(value) === normalize(answer),
  )
}

export function getCorrect(
  session: Pick<Session, 'words' | 'answers'> & { checked?: boolean[] },
): number {
  return session.words.filter(
    (word, index) =>
      (!session.checked || session.checked[index]) && isCorrect(session.answers[index] ?? '', word),
  ).length
}
