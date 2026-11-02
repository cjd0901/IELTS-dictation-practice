import type { Settings } from '../types/study.ts'

export const DEFAULT_SETTINGS: Settings = {
  audioSource: 'online',
  accent: 'en-GB',
  rate: 1,
  auto: false,
  repeat: 1,
  dailyGoal: 20,
}

export const isValidDailyGoal = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0
