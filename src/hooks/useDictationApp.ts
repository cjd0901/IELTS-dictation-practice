import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { downloadHistory } from '../services/exportHistory.ts'
import { createContinuousAdvance } from '../services/continuousAdvance.ts'
import type { ModalName, RecordEntry, View, Word } from '../types/study.ts'
import { revealWordRow } from '../utils/dom.ts'
import {
  addHistoryEntry,
  gradePending,
  newSession,
  shuffleSession,
  updateMistakes,
} from '../utils/session.ts'
import { isAnswerEditingKey, resolveGlobalShortcut } from '../utils/shortcuts.ts'
import { usePronunciation } from './usePronunciation.ts'
import { useStudyStore } from './useStudyStore.ts'
import { useToast } from './useToast.ts'

export function useDictationApp() {
  const study = useStudyStore()
  const {
    session,
    setSession,
    settings,
    history,
    setHistory,
    mistakes,
    setMistakes,
    checked,
    today,
  } = study
  const { toast, notify } = useToast()
  const [view, setView] = useState<View>('practice')
  const [active, setActive] = useState(0)
  const [continuous, setContinuous] = useState(false)
  const [modal, setModal] = useState<ModalName>(null)
  const [detail, setDetail] = useState<RecordEntry | null>(null)
  const [onlyWrong, setOnlyWrong] = useState(false)
  const [query, setQuery] = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const suppressAuto = useRef(false)
  const grading = useRef(false)
  const advance = useRef<ReturnType<typeof createContinuousAdvance> | null>(null)
  const getAdvance = useCallback(() => {
    if (!advance.current) advance.current = createContinuousAdvance()
    return advance.current
  }, [])
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playbackFailure = useCallback(
    (message: string) => {
      advance.current?.cancel()
      setContinuous(false)
      notify(message)
    },
    [notify],
  )
  const { speaking, pronounce, stopPronunciation } = usePronunciation(settings, playbackFailure)

  const stop = useCallback(() => {
    stopPronunciation()
    advance.current?.cancel()
    setContinuous(false)
  }, [stopPronunciation])
  useEffect(() => {
    grading.current = false
  }, [session])
  useEffect(
    () => () => {
      advance.current?.cancel()
      if (focusTimer.current) clearTimeout(focusTimer.current)
    },
    [],
  )

  const playWord = useCallback(
    (index: number) => {
      stop()
      setActive(index)
      pronounce(session.words[index], index)
    },
    [stop, pronounce, session.words],
  )
  const focusRow = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(index, session.words.length - 1))
      setActive(next)
      const input = inputs.current[next]
      input?.focus({ preventScroll: true })
      revealWordRow(input)
    },
    [session.words.length],
  )
  const scheduleFocus = (delay: number) => {
    if (focusTimer.current) clearTimeout(focusTimer.current)
    focusTimer.current = setTimeout(() => inputs.current[0]?.focus(), delay)
  }
  const startSession = (chapter: string, group = 0, words?: Word[]) => {
    stop()
    grading.current = false
    setSession(newSession(chapter, group, words))
    setActive(0)
    setOnlyWrong(false)
    setView('practice')
    setModal(null)
    scheduleFocus(80)
  }
  const grade = useCallback(() => {
    if (grading.current) return
    // Do not allocate timestamps or IDs for no-op submissions.
    if (!session.answers.some((answer, index) => answer.trim() && !checked[index])) {
      notify('输入新的答案后，再按 Ctrl + Enter 批改。')
      return
    }
    grading.current = true
    stop()
    const result = gradePending(session, crypto.randomUUID(), new Date().toISOString())
    if (!result) return
    const { entry } = result
    setSession((current) => ({ ...current, checked: result.checked, graded: result.graded }))
    setHistory((current) => addHistoryEntry(current, entry))
    setMistakes((current) => updateMistakes(current, entry.words, entry.answers))
    notify(`已批改 ${entry.words.length} 个词，答对 ${entry.correct} 个。空白行未参与批改。`)
  }, [session, checked, stop, notify, setSession, setHistory, setMistakes])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const action = resolveGlobalShortcut(
        event,
        !modal && !detail && view === 'practice',
        target?.tagName === 'INPUT' || target === document.body,
      )
      if (action === 'grade') {
        event.preventDefault()
        grade()
      } else if (action === 'replay') {
        event.preventDefault()
        if (!event.repeat) playWord(active)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, grade, playWord, view, modal, detail])

  const toggleContinuous = () => {
    if (continuous) {
      stop()
      return
    }
    stop()
    setContinuous(true)
    const run = (index: number) => {
      const onAudioEnd = getAdvance().begin(index, () => run(index + 1))
      setActive(index)
      suppressAuto.current = true
      inputs.current[index]?.focus({ preventScroll: true })
      suppressAuto.current = false
      revealWordRow(inputs.current[index])
      pronounce(session.words[index], index, () => {
        if (index + 1 >= session.words.length) {
          advance.current?.cancel()
          setContinuous(false)
          return
        }
        onAudioEnd()
      })
    }
    run(active)
  }
  const shuffle = () => {
    if (checked.some(Boolean)) return
    stop()
    // Draw randomness once in the event, not inside a Strict Mode-replayed updater.
    const shuffled = shuffleSession(session)
    setSession((current) => ({
      ...current,
      words: shuffled.words,
      answers: shuffled.answers,
      checked: shuffled.checked,
      shuffled: true,
    }))
    setActive(0)
    notify('单词顺序已打乱，已输入的内容会随单词保留。')
  }
  const reset = () => {
    stop()
    grading.current = false
    setSession((current) => ({
      ...current,
      answers: current.words.map(() => ''),
      checked: current.words.map(() => false),
      graded: false,
    }))
    setOnlyWrong(false)
    setActive(0)
    notify('本组已重新开始。')
    scheduleFocus(50)
  }
  const changeView = (next: View) => {
    stop()
    setView(next)
    setQuery('')
  }
  const exportHistory = () => {
    // Preserve the original one-second URL lifetime even when the view closes.
    downloadHistory(history, mistakes, today)
    notify('学习记录已导出。')
  }
  const onAnswerChange = useCallback(
    (index: number, value: string) => {
      advance.current?.input(index)
      setSession((current) => ({
        ...current,
        answers: current.answers.map((answer, i) => (i === index ? value : answer)),
      }))
    },
    [setSession],
  )
  const bindInput = useCallback((index: number, element: HTMLInputElement | null) => {
    inputs.current[index] = element
  }, [])
  const onRowFocus = useCallback(
    (index: number) => {
      setActive(index)
      if (settings.auto && !checked[index] && !suppressAuto.current) {
        stop()
        pronounce(session.words[index], index)
      }
    },
    [settings.auto, checked, session.words, stop, pronounce],
  )
  const onRowKeyDown = useCallback(
    (index: number, event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.nativeEvent.isComposing) {
        if (!event.currentTarget.readOnly) advance.current?.compositionStart(index)
        return
      }
      if (!event.currentTarget.readOnly && isAnswerEditingKey(event)) {
        advance.current?.keyDown(index, event.code || event.key)
      }
      if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        if (event.shiftKey) return
        if (index === session.words.length - 1) notify('已到最后一行，按 Ctrl + Enter 批改本组。')
        else focusRow(index + 1)
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        focusRow(index + (event.key === 'ArrowDown' ? 1 : -1))
      }
    },
    [session.words.length, notify, focusRow],
  )
  const onRowKeyUp = useCallback((index: number, event: ReactKeyboardEvent<HTMLInputElement>) => {
    advance.current?.keyUp(index, event.code || event.key)
  }, [])
  const onRowBlur = useCallback((index: number) => advance.current?.blur(index), [])
  const onCompositionStart = useCallback(
    (index: number) => advance.current?.compositionStart(index),
    [],
  )
  const onCompositionEnd = useCallback(
    (index: number) => advance.current?.compositionEnd(index),
    [],
  )

  return {
    ...study,
    toast,
    notify,
    view,
    changeView,
    active,
    speaking,
    continuous,
    modal,
    setModal,
    detail,
    setDetail,
    onlyWrong,
    setOnlyWrong,
    query,
    setQuery,
    inputs,
    stop,
    pronounce,
    playWord,
    startSession,
    grade,
    reset,
    shuffle,
    toggleContinuous,
    exportHistory,
    onAnswerChange,
    onRowFocus,
    onRowKeyDown,
    onRowKeyUp,
    onRowBlur,
    onCompositionStart,
    onCompositionEnd,
    bindInput,
  }
}

export type DictationApp = ReturnType<typeof useDictationApp>
