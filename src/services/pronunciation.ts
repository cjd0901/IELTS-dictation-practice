import type { Settings, Word } from '../types/study.ts'

export type SpeechEnvironment = {
  synthesis?: Pick<SpeechSynthesis, 'cancel' | 'getVoices' | 'speak'>
  createUtterance: (text: string) => SpeechSynthesisUtterance
  createAudio: (url: string) => HTMLAudioElement
}
type PronunciationSettings = Pick<Settings, 'accent' | 'rate' | 'repeat'>

export const speechText = (word: string) =>
  word
    .split(/\s*[=／/]\s*/)[0]
    .replace(/\([^)]*\)/g, '')
    .replace(/\bsb\./g, 'somebody')
    .replace(/\bsth\./g, 'something')
    .trim()

export const dictionaryUrl = (text: string, accent: Settings['accent']) =>
  `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${accent === 'en-GB' ? 1 : 2}`

export function createPronunciationPlayer(
  onSpeaking: (index: number | null) => void,
  onFailure: (message: string) => void,
  environment: SpeechEnvironment,
) {
  let token = 0
  let audio: HTMLAudioElement | null = null
  let utterance: SpeechSynthesisUtterance | null = null

  function cancelResources() {
    if (audio) {
      audio.onended = null
      audio.onerror = null
      audio.pause()
      audio = null
    }
    if (utterance) {
      utterance.onend = null
      utterance.onerror = null
      utterance = null
    }
    environment.synthesis?.cancel()
  }

  function stop() {
    token++
    cancelResources()
    onSpeaking(null)
  }

  function dispose() {
    // Invalidates pending play() promises without dispatching React state on unmount.
    token++
    cancelResources()
  }

  function speak(word: Word, index: number, settings: PronunciationSettings, onEnd?: () => void) {
    const currentToken = ++token
    cancelResources()
    onSpeaking(index)
    const text = speechText(word.w)
    let count = 0

    function finish() {
      if (currentToken !== token) return
      if (++count < settings.repeat) {
        say()
        return
      }
      onSpeaking(null)
      onEnd?.()
    }

    function fail(message: string) {
      if (currentToken !== token) return
      onSpeaking(null)
      onFailure(message)
    }

    function fallback() {
      if (currentToken !== token) return
      const player = environment.createAudio(dictionaryUrl(text, settings.accent))
      player.playbackRate = settings.rate
      audio = player
      player.onended = finish
      player.onerror = () => fail('发音暂时不可用，请检查网络或切换浏览器语音。')
      player.play().catch(() => fail('无法播放发音，请检查网络和浏览器声音设置。'))
    }

    function say() {
      if (currentToken !== token) return
      const synthesis = environment.synthesis
      if (!synthesis) {
        fallback()
        return
      }
      const voices = synthesis.getVoices()
      const voice =
        voices.find((item) => item.lang === settings.accent && item.localService) ??
        voices.find((item) => item.lang === settings.accent) ??
        voices.find((item) => item.lang.startsWith('en'))
      if (!voice) {
        fallback()
        return
      }
      const next = environment.createUtterance(text)
      utterance = next
      next.lang = settings.accent
      next.voice = voice
      next.rate = settings.rate
      next.onend = finish
      next.onerror = (event) => {
        if (event.error !== 'canceled' && event.error !== 'interrupted') fallback()
      }
      synthesis.speak(next)
    }

    say()
  }

  return { speak, stop, dispose }
}

export function browserSpeechEnvironment(): SpeechEnvironment {
  return {
    synthesis: 'speechSynthesis' in window ? window.speechSynthesis : undefined,
    createUtterance: (text) => new SpeechSynthesisUtterance(text),
    createAudio: (url) => new Audio(url),
  }
}
