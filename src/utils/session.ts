import { CHAPTERS, GROUP_SIZE } from '../data/vocabulary.ts'
import type { RecordEntry, Session, Word } from '../types/study.ts'
import { getCorrect, isCorrect } from './grading.ts'

export function newSession(chapter = '3.2', group = 0, words?: Word[]): Session {
  const selected = words ?? CHAPTERS[chapter].slice(group * GROUP_SIZE, (group + 1) * GROUP_SIZE)
  return {
    chapter,
    group,
    words: selected,
    answers: selected.map(() => ''),
    checked: selected.map(() => false),
    graded: false,
    review: !!words,
    shuffled: false,
  }
}

export function getChecked(session: Session): boolean[] {
  return session.checked ?? session.answers.map((answer) => session.graded && !!answer.trim())
}

export function gradePending(session: Session, id: string, date: string) {
  const checked = getChecked(session)
  const indices = session.answers
    .map((answer, index) => (answer.trim() && !checked[index] ? index : -1))
    .filter((index) => index >= 0)
  if (!indices.length) return null

  const words = indices.map((index) => session.words[index])
  const answers = indices.map((index) => session.answers[index])
  const correct = getCorrect({ words, answers })
  const pending = new Set(indices)
  const nextChecked = checked.map((value, index) => value || pending.has(index))
  const entry: RecordEntry = {
    id,
    date,
    chapter: session.chapter,
    group: session.group,
    words,
    answers,
    correct,
    review: session.review,
  }
  return { entry, checked: nextChecked, graded: nextChecked.every(Boolean) }
}

export function updateMistakes(current: Word[], words: Word[], answers: string[]): Word[] {
  const map = new Map(current.map((word) => [word.id, word]))
  words.forEach((word, index) => {
    if (isCorrect(answers[index], word)) map.delete(word.id)
    else map.set(word.id, word)
  })
  return [...map.values()]
}

export function addHistoryEntry(history: RecordEntry[], entry: RecordEntry): RecordEntry[] {
  return [entry, ...history].slice(0, 100)
}

export function shuffleSession(session: Session, random = Math.random): Session {
  const entries = session.words.map((word, index) => ({ word, answer: session.answers[index] }))
  for (let index = entries.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[entries[index], entries[other]] = [entries[other], entries[index]]
  }
  return {
    ...session,
    words: entries.map((entry) => entry.word),
    answers: entries.map((entry) => entry.answer),
    checked: entries.map(() => false),
    shuffled: true,
  }
}

export function migrateLegacyHistory(history: RecordEntry[]) {
  if (!history.some((entry) => entry.answers.some((answer) => !answer.trim()))) return null
  const attempted = new Set(
    history.flatMap((entry) =>
      entry.words.filter((_, index) => entry.answers[index]?.trim()).map((word) => word.id),
    ),
  )
  const blanks = new Set(
    history.flatMap((entry) =>
      entry.words.filter((_, index) => !entry.answers[index]?.trim()).map((word) => word.id),
    ),
  )
  const migrated = history
    .map((entry) => {
      const indices = entry.answers
        .map((answer, index) => (answer.trim() ? index : -1))
        .filter((index) => index >= 0)
      const words = indices.map((index) => entry.words[index])
      const answers = indices.map((index) => entry.answers[index])
      return { ...entry, words, answers, correct: getCorrect({ words, answers }) }
    })
    .filter((entry) => entry.words.length > 0)
  return {
    history: migrated,
    blankOnlyIds: new Set([...blanks].filter((id) => !attempted.has(id))),
  }
}
