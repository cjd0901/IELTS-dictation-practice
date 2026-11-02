import { restoreSession } from '../services/sessionPersistence.ts'
import { useEffect, useMemo, useState } from 'react'
import { CHAPTERS, GROUP_SIZE } from '../data/vocabulary.ts'
import { load, save } from '../services/storage.ts'
import type { RecordEntry, Session, Settings, Word } from '../types/study.ts'
import { getCorrect } from '../utils/grading.ts'
import { getChecked, migrateLegacyHistory } from '../utils/session.ts'
import { DEFAULT_SETTINGS, isValidDailyGoal } from '../utils/settings.ts'
import { getLearningStats, localDateKey } from '../utils/statistics.ts'

export function useStudyStore() {
  const [session, setSession] = useState<Session>(restoreSession)
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...load('settings', {}),
  }))
  const [history, setHistory] = useState<RecordEntry[]>(() => load('history', []))
  const [mistakes, setMistakes] = useState<Word[]>(() => load('mistakes', []))
  const [storageOk, setStorageOk] = useState(true)

  useEffect(() => {
    if (!session.checked) {
      setSession((current) => ({
        ...current,
        checked: getChecked(current),
        graded: current.answers.every((answer) => !!answer.trim()) && current.graded,
      }))
      return
    }
    setStorageOk(save('session', session))
  }, [session])
  useEffect(() => {
    if (!save('settings', settings)) setStorageOk(false)
  }, [settings])
  useEffect(() => {
    if (!save('history', history)) setStorageOk(false)
  }, [history])
  useEffect(() => {
    if (!save('mistakes', mistakes)) setStorageOk(false)
  }, [mistakes])
  useEffect(() => {
    const migration = migrateLegacyHistory(history)
    if (!migration) return
    setHistory(migration.history)
    setMistakes((current) => current.filter((word) => !migration.blankOnlyIds.has(word.id)))
  }, [history])

  const checked = useMemo(() => getChecked(session), [session])
  const checkedCount = useMemo(() => checked.filter(Boolean).length, [checked])
  const answered = useMemo(
    () => session.answers.filter((answer) => answer.trim()).length,
    [session.answers],
  )
  const correct = useMemo(() => getCorrect({ ...session, checked }), [session, checked])
  // Keep the original local-day-on-render behavior (no new midnight timer).
  const today = localDateKey(new Date())
  const stats = useMemo(() => getLearningStats(history, today), [history, today])
  const dailyGoal = isValidDailyGoal(settings.dailyGoal)
    ? settings.dailyGoal
    : DEFAULT_SETTINGS.dailyGoal
  const groupCount = Math.ceil(CHAPTERS[session.chapter].length / GROUP_SIZE)

  return {
    session,
    setSession,
    settings,
    setSettings,
    history,
    setHistory,
    mistakes,
    setMistakes,
    storageOk,
    checked,
    checkedCount,
    answered,
    correct,
    today,
    dailyGoal,
    groupCount,
    ...stats,
  }
}
