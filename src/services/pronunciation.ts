import type { Settings, Word } from '../types/study.ts'

export type SpeechEnvironment = {
  synthesis?: Pick<
    SpeechSynthesis,
    'cancel' | 'getVoices' | 'speak' | 'addEventListener' | 'removeEventListener'
  >
  createUtterance: (text: string) => SpeechSynthesisUtterance
  createAudio: (url: string) => HTMLAudioElement
}
type PronunciationSettings = Pick<Settings, 'audioSource' | 'accent' | 'rate' | 'repeat'>
type VoiceClock = {
  setTimer: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>
  clearTimer: (timer: ReturnType<typeof setTimeout>) => void
}
const voiceClock: VoiceClock = {
  setTimer: (callback, delay) => setTimeout(callback, delay),
  clearTimer: (timer) => clearTimeout(timer),
}
const VOICE_WAIT_MS = 2000

function selectVoice(voices: SpeechSynthesisVoice[], accent: Settings['accent']) {
  const language = (value: string) => value.toLowerCase().replaceAll('_', '-')
  const english = voices.filter((voice) => /^en(?:-|$)/.test(language(voice.lang)))
  const matches = (voice: SpeechSynthesisVoice) => language(voice.lang) === language(accent)
  // Browser speech may expose remote voices too; localService is a preference, not a gate.
  return (
    english.find((voice) => matches(voice) && voice.localService) ??
    english.find(matches) ??
    english[0]
  )
}

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
  clock: VoiceClock = voiceClock,
) {
  let token = 0
  let audio: HTMLAudioElement | null = null
  let utterance: SpeechSynthesisUtterance | null = null
  let cancelVoiceWait: (() => void) | null = null

  function cancelResources() {
    cancelVoiceWait?.()
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

    function playOnline() {
      if (currentToken !== token) return
      const player = environment.createAudio(dictionaryUrl(text, settings.accent))
      player.playbackRate = settings.rate
      audio = player
      player.onended = finish
      player.onerror = () => fail('在线发音暂时不可用，请检查网络或切换本地音频。')
      player.play().catch(() => fail('无法播放在线发音，请检查网络和浏览器声音设置。'))
    }

    function say() {
      if (currentToken !== token) return
      if (settings.audioSource === 'online') {
        playOnline()
        return
      }
      const synthesis = environment.synthesis
      if (!synthesis) {
        fail('当前浏览器不支持语音播放，请切换在线音频。')
        return
      }

      const speakVoice = (voice: SpeechSynthesisVoice) => {
        if (currentToken !== token) return
        const next = environment.createUtterance(text)
        utterance = next
        next.lang = settings.accent
        next.voice = voice
        next.rate = settings.rate
        next.onend = finish
        next.onerror = (event) => {
          if (event.error !== 'canceled' && event.error !== 'interrupted') {
            fail('本地发音失败，请切换在线音频或检查系统语音设置。')
          }
        }
        synthesis.speak(next)
      }

      const voice = selectVoice(synthesis.getVoices(), settings.accent)
      if (voice) {
        speakVoice(voice)
        return
      }

      // Voice enumeration can be empty on first use, or populate in several batches.
      let settled = false
      let timer: ReturnType<typeof setTimeout> | undefined
      const cleanup = () => {
        settled = true
        synthesis.removeEventListener('voiceschanged', onVoicesChanged)
        if (timer !== undefined) clock.clearTimer(timer)
        timer = undefined
        if (cancelVoiceWait === cleanup) cancelVoiceWait = null
      }
      const onVoicesChanged = () => {
        if (settled || currentToken !== token) return
        const loaded = selectVoice(synthesis.getVoices(), settings.accent)
        if (loaded) {
          cleanup()
          speakVoice(loaded)
        }
      }
      cancelVoiceWait = cleanup
      synthesis.addEventListener('voiceschanged', onVoicesChanged)
      timer = clock.setTimer(() => {
        if (settled || currentToken !== token) return
        const loaded = selectVoice(synthesis.getVoices(), settings.accent)
        cleanup()
        if (loaded) speakVoice(loaded)
        else fail('暂未获取到英语语音，请稍后重试或切换在线音频。')
      }, VOICE_WAIT_MS)
      // Recheck after listening so a list populated during registration is not missed.
      onVoicesChanged()
    }

    say()
  }

  return { speak, stop, dispose }
}

export function browserSpeechEnvironment(): SpeechEnvironment {
  const synthesis = 'speechSynthesis' in window ? window.speechSynthesis : undefined
  synthesis?.getVoices()
  return {
    synthesis,
    createUtterance: (text) => new SpeechSynthesisUtterance(text),
    createAudio: (url) => new Audio(url),
  }
}
