import { CHAPTERS } from '../data/vocabulary.ts'
import type { Session } from '../types/study.ts'
import { getChecked, newSession } from '../utils/session.ts'
import { load } from './storage.ts'

export function restoreSession(): Session {
  const value = load<Session | null>('session', null)
  // Preserve the original acceptance rules and migration for pre-checked saves.
  if (
    value &&
    CHAPTERS[value.chapter] &&
    Array.isArray(value.words) &&
    value.words.length > 0 &&
    value.words.length === value.answers?.length &&
    value.words.every((word) => typeof word.w === 'string' && typeof word.m === 'string')
  ) {
    return {
      ...value,
      checked: getChecked(value),
      graded: value.words.every(
        (_, index) => (value.checked?.[index] ?? value.graded) && !!value.answers[index].trim(),
      ),
    }
  }
  return newSession()
}
