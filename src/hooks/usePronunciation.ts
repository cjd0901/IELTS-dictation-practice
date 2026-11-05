import { useCallback, useEffect, useRef, useState } from 'react'
import { browserSpeechEnvironment, createPronunciationPlayer } from '../services/pronunciation.ts'
import type { Settings, Word } from '../types/study.ts'

export function usePronunciation(settings: Settings, onFailure: (message: string) => void) {
  const [speaking, setSpeaking] = useState<number | null>(null)
  const failure = useRef(onFailure)
  useEffect(() => {
    failure.current = onFailure
  }, [onFailure])
  const player = useRef<ReturnType<typeof createPronunciationPlayer> | null>(null)
  const getPlayer = useCallback(() => {
    if (!player.current) {
      player.current = createPronunciationPlayer(
        setSpeaking,
        (message) => failure.current(message),
        browserSpeechEnvironment(),
      )
    }
    return player.current
  }, [])
  const stopPronunciation = useCallback(() => getPlayer().stop(), [getPlayer])
  const { audioSource, accent, voiceURI, rate, repeat } = settings
  const pronounce = useCallback(
    (word: Word, index: number, onEnd?: () => void) => {
      getPlayer().speak(word, index, { audioSource, accent, voiceURI, rate, repeat }, onEnd)
    },
    [getPlayer, audioSource, accent, voiceURI, rate, repeat],
  )
  useEffect(
    () => () => {
      player.current?.dispose()
      player.current = null
    },
    [],
  )
  return { speaking, pronounce, stopPronunciation }
}
