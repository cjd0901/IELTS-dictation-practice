export type Word = { id: string; w: string; p: string; m: string }

export type Session = {
  chapter: string
  group: number
  words: Word[]
  answers: string[]
  checked: boolean[]
  graded: boolean
  review: boolean
  shuffled: boolean
}

export type RecordEntry = {
  id: string
  date: string
  chapter: string
  group: number
  words: Word[]
  answers: string[]
  correct: number
  review: boolean
}

export type Settings = {
  audioSource: 'local' | 'online'
  accent: 'en-GB' | 'en-US'
  rate: number
  auto: boolean
  repeat: number
  dailyGoal: number
}

export type View = 'practice' | 'library' | 'mistakes' | 'history'
export type ModalName = 'help' | 'settings' | 'chapters' | null
export type StartSession = (chapter: string, group?: number, words?: Word[]) => void
