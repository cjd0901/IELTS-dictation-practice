// Compatibility entry point. New modules import their owning layer directly.
export type { Word, Session, RecordEntry, Settings } from './types/study.ts'
export { CHAPTERS, TOTAL, GROUP_SIZE, chapterTitle, chapterSubtitle } from './data/vocabulary.ts'
export { load, save } from './services/storage.ts'
export { newSession } from './utils/session.ts'
export { restoreSession } from './services/sessionPersistence.ts'
export { normalize, isCorrect, getCorrect } from './utils/grading.ts'
export { isValidDailyGoal } from './utils/settings.ts'
