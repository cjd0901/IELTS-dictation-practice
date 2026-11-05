import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createPronunciationPlayer,
  dictionaryUrl,
  speechText,
} from '../src/services/pronunciation.ts'
import { DEFAULT_SETTINGS } from '../src/utils/settings.ts'

const settings = {
  audioSource: 'local',
  accent: 'en-GB',
  rate: 0.8,
  repeat: 1,
  auto: false,
  dailyGoal: 20,
}
const onlineSettings = { ...settings, audioSource: 'online' }
const word = { id: 'test', w: 'notice board', m: '告示板', p: '' }
function setup(voices = [], audioReject = false, synthesisAvailable = true) {
  const utterances = [],
    audios = [],
    states = [],
    errors = []
  let cancellations = 0
  let now = 0
  let timerId = 0
  const listeners = new Set()
  const timers = new Map()
  const synthesis = {
    getVoices: () => voices,
    cancel: () => cancellations++,
    speak: (item) => utterances.push(item),
    addEventListener: (name, listener) => {
      assert.equal(name, 'voiceschanged')
      listeners.add(listener)
    },
    removeEventListener: (name, listener) => {
      assert.equal(name, 'voiceschanged')
      listeners.delete(listener)
    },
  }
  const player = createPronunciationPlayer(
    (value) => states.push(value),
    (message) => errors.push(message),
    {
      synthesis: synthesisAvailable ? synthesis : undefined,
      createUtterance: (text) => ({ text }),
      createAudio: (url) => {
        const audio = {
          url,
          paused: false,
          pause() {
            this.paused = true
          },
          play: () => (audioReject ? Promise.reject(Error('blocked')) : Promise.resolve()),
        }
        audios.push(audio)
        return audio
      },
    },
    {
      setTimer(callback, delay) {
        const id = ++timerId
        timers.set(id, { callback, at: now + delay })
        return id
      },
      clearTimer: (id) => timers.delete(id),
    },
  )
  return {
    player,
    utterances,
    audios,
    states,
    errors,
    listeners,
    timers,
    cancellations: () => cancellations,
    setVoices(next, notify = true) {
      voices = next
      if (notify) for (const listener of [...listeners]) listener()
    },
    advance(milliseconds) {
      now += milliseconds
      for (const [id, timer] of [...timers]) {
        if (timer.at <= now) {
          timers.delete(id)
          timer.callback()
        }
      }
    },
  }
}

test('speech text and exact dictionary request parameters are preserved', () => {
  assert.equal(speechText('give sb. sth. (formal) = alternate'), 'give somebody something')
  assert.equal(
    dictionaryUrl('notice board', 'en-GB'),
    'https://dict.youdao.com/dictvoice?audio=notice%20board&type=1',
  )
  assert.equal(
    dictionaryUrl('a&b', 'en-US'),
    'https://dict.youdao.com/dictvoice?audio=a%26b&type=2',
  )
})

test('online source is the default and always uses Youdao despite installed local voices', () => {
  assert.equal(DEFAULT_SETTINGS.audioSource, 'online')
  const env = setup([{ lang: 'en-GB', localService: true }])
  env.player.speak(word, 2, onlineSettings)
  assert.equal(env.utterances.length, 0)
  assert.equal(env.audios.length, 1)
  assert.equal(env.audios[0].url, dictionaryUrl('notice board', 'en-GB'))
  assert.equal(env.audios[0].playbackRate, 0.8)
  env.player.speak(word, 3, { ...onlineSettings, accent: 'en-US', rate: 1.2 })
  assert.equal(env.audios[1].url, dictionaryUrl('notice board', 'en-US'))
  assert.equal(env.audios[1].playbackRate, 1.2)
  assert.equal(env.audios[0].paused, true)
})

test('browser speech prefers matching local voices and accepts other available English voices', () => {
  const remote = { lang: 'en-GB', localService: false },
    local = { lang: 'en-GB', localService: true },
    otherLocal = { lang: 'en-US', localService: true }
  for (const [voices, expected] of [
    [[remote, local], local],
    [[remote, otherLocal], remote],
    [[otherLocal, local], local],
    [[remote], remote],
    [[otherLocal], otherLocal],
    [[{ lang: 'EN_gb', localService: true }], { lang: 'EN_gb', localService: true }],
    [[{ lang: 'en-US' }], { lang: 'en-US' }],
  ]) {
    const env = setup(voices)
    env.player.speak(word, 2, settings)
    assert.deepEqual(env.utterances[0].voice, expected)
    assert.equal(env.utterances[0].rate, 0.8)
    assert.equal(env.utterances[0].text, 'notice board')
    assert.equal(env.audios.length, 0)
  }
})

test('a saved voice overrides the first matching voice and is used for every repeat', () => {
  const first = { voiceURI: 'first', name: 'First voice', lang: 'en-US', localService: true }
  const chosen = { voiceURI: 'chosen', name: 'Chosen voice', lang: 'en-US', localService: false }
  const env = setup([first, chosen])
  env.player.speak(word, 0, { ...settings, accent: 'en-US', voiceURI: 'chosen', repeat: 2 })
  assert.equal(env.utterances[0].voice, chosen)
  assert.equal(env.utterances[0].lang, 'en-US')
  env.utterances[0].onend()
  assert.equal(env.utterances[1].voice, chosen)
})

test('missing or mismatched saved voices fall back to the current accent', () => {
  const british = { voiceURI: 'british', lang: 'en-GB', localService: true }
  const american = { voiceURI: 'american', lang: 'en-US', localService: true }
  const chinese = { voiceURI: 'chinese', lang: 'zh-CN', localService: true }
  for (const voiceURI of ['', 'removed', 'american', 'chinese']) {
    const env = setup([american, chinese, british])
    env.player.speak(word, 0, { ...settings, voiceURI })
    assert.equal(env.utterances[0].voice, british)
  }
})

test('a chosen fallback English voice uses its own language when the requested accent is absent', () => {
  const canadian = { voiceURI: 'canadian', lang: 'en-CA', localService: true }
  const american = { voiceURI: 'american', lang: 'en-US', localService: true }
  const env = setup([american, canadian])
  env.player.speak(word, 0, { ...settings, voiceURI: 'canadian' })
  assert.equal(env.utterances[0].voice, canadian)
  assert.equal(env.utterances[0].lang, 'en-CA')
})

test('the saved voice is honored when voices arrive asynchronously', () => {
  const first = { voiceURI: 'first', lang: 'en-GB', localService: true }
  const chosen = { voiceURI: 'chosen', lang: 'en-GB', localService: true }
  const env = setup()
  env.player.speak(word, 0, { ...settings, voiceURI: 'chosen' })
  env.setVoices([first, chosen])
  assert.equal(env.utterances[0].voice, chosen)
  assert.equal(env.listeners.size, 0)
})

test('a saved local voice does not affect online pronunciation', () => {
  const env = setup([{ voiceURI: 'chosen', lang: 'en-GB', localService: true }])
  env.player.speak(word, 0, { ...onlineSettings, voiceURI: 'chosen' })
  assert.equal(env.utterances.length, 0)
  assert.equal(env.audios[0].url, dictionaryUrl(word.w, settings.accent))
})

test('both sources finish after all repeats before advancing continuous playback', () => {
  for (const audioSource of ['local', 'online']) {
    const env = setup([{ lang: 'en-GB', localService: true }])
    let ended = 0
    env.player.speak(word, 4, { ...settings, audioSource, repeat: 3 }, () => ended++)
    const clips = audioSource === 'local' ? env.utterances : env.audios
    const end = (index) =>
      audioSource === 'local' ? clips[index].onend() : clips[index].onended()
    end(0)
    end(1)
    assert.equal(ended, 0)
    end(2)
    assert.equal(ended, 1)
    assert.equal(clips.length, 3)
    assert.deepEqual(env.states, [4, null])
  }
})

test('missing speech support reports an error without silently using Youdao', () => {
  const env = setup([], false, false)
  env.player.speak(word, 0, settings)
  assert.deepEqual(env.errors, ['当前浏览器不支持语音播放，请切换在线音频。'])
  assert.equal(env.audios.length, 0)
  assert.deepEqual(env.states, [0, null])
})

test('missing English voices are reported only after waiting for the voice list', () => {
  for (const env of [
    setup(),
    setup([{ lang: 'zh-CN', localService: true }]),
  ]) {
    env.player.speak(word, 0, settings)
    assert.deepEqual(env.errors, [])
    env.advance(1999)
    assert.deepEqual(env.errors, [])
    env.advance(1)
    assert.equal(env.audios.length, 0)
    assert.deepEqual(env.errors, ['暂未获取到英语语音，请稍后重试或切换在线音频。'])
    assert.deepEqual(env.states, [0, null])
    assert.equal(env.listeners.size, 0)
    assert.equal(env.timers.size, 0)
  }
})

test('first-use voice loading starts speech on voiceschanged and releases the wait resources', () => {
  const env = setup()
  env.player.speak(word, 2, settings)
  assert.equal(env.utterances.length, 0)
  assert.equal(env.listeners.size, 1)
  assert.equal(env.timers.size, 1)
  env.setVoices([{ lang: 'en-GB', localService: true }])
  assert.equal(env.utterances.length, 1)
  assert.equal(env.utterances[0].text, 'notice board')
  assert.equal(env.listeners.size, 0)
  assert.equal(env.timers.size, 0)
  env.advance(5000)
  assert.deepEqual(env.errors, [])
  assert.equal(env.utterances.length, 1)
})

test('voice enumeration can populate in batches without prematurely reporting failure', () => {
  const env = setup()
  env.player.speak(word, 0, settings)
  env.setVoices([{ lang: 'zh-CN', localService: true }])
  assert.equal(env.utterances.length, 0)
  assert.deepEqual(env.errors, [])
  env.setVoices([{ lang: 'en-GB', localService: false }])
  assert.equal(env.utterances.length, 1)
  assert.equal(env.utterances[0].voice.localService, false)
})

test('the deadline rechecks voices even when the browser omits voiceschanged', () => {
  const env = setup()
  env.player.speak(word, 0, settings)
  env.setVoices([{ lang: 'en-GB', localService: true }], false)
  env.advance(2000)
  assert.equal(env.utterances.length, 1)
  assert.deepEqual(env.errors, [])
  assert.equal(env.listeners.size, 0)
})

test('stopping while voices load prevents delayed speech and errors', () => {
  const env = setup()
  env.player.speak(word, 0, settings)
  const staleListener = [...env.listeners][0]
  env.player.stop()
  assert.equal(env.listeners.size, 0)
  assert.equal(env.timers.size, 0)
  env.setVoices([{ lang: 'en-GB', localService: true }])
  staleListener()
  env.advance(5000)
  assert.equal(env.utterances.length, 0)
  assert.deepEqual(env.errors, [])
  assert.deepEqual(env.states, [0, null])
})

test('switching to Youdao while voices load cleans up the old wait without delaying online audio', () => {
  const env = setup()
  env.player.speak(word, 0, settings)
  const staleListener = [...env.listeners][0]
  env.player.speak(word, 1, onlineSettings)
  assert.equal(env.audios.length, 1)
  assert.equal(env.listeners.size, 0)
  assert.equal(env.timers.size, 0)
  env.setVoices([{ lang: 'en-GB', localService: true }])
  staleListener()
  env.advance(5000)
  assert.equal(env.utterances.length, 0)
  assert.deepEqual(env.errors, [])
})

test('disposal cancels voice loading without updating unmounted React state', () => {
  const env = setup()
  env.player.speak(word, 0, settings)
  env.player.dispose()
  assert.equal(env.listeners.size, 0)
  assert.equal(env.timers.size, 0)
  env.advance(5000)
  env.setVoices([{ lang: 'en-GB', localService: true }])
  assert.deepEqual(env.states, [0])
  assert.deepEqual(env.errors, [])
  assert.equal(env.utterances.length, 0)
  env.player.speak(word, 1, settings)
  assert.equal(env.utterances.length, 1)
})

test('local speech failures report an error, while deliberate cancellation stays silent', () => {
  const env = setup([{ lang: 'en-GB', localService: true }])
  env.player.speak(word, 0, settings)
  env.utterances[0].onerror({ error: 'canceled' })
  assert.equal(env.audios.length, 0)
  env.utterances[0].onerror({ error: 'network' })
  assert.equal(env.audios.length, 0)
  assert.deepEqual(env.errors, ['本地发音失败，请切换在线音频或检查系统语音设置。'])
})

test('new playback and stop invalidate stale completions and pending online errors', async () => {
  const env = setup([], true)
  let ended = 0
  env.player.speak(word, 0, onlineSettings, () => ended++)
  const oldEnd = env.audios[0].onended
  env.player.stop()
  oldEnd()
  await Promise.resolve()
  assert.equal(ended, 0)
  assert.deepEqual(env.errors, [])
  assert.equal(env.audios[0].paused, true)
  assert.equal(env.audios[0].onended, null)
})

test('online audio failures explain the selected source and do not switch to local speech', async () => {
  const blocked = setup([], true)
  blocked.player.speak(word, 0, onlineSettings)
  await Promise.resolve()
  assert.deepEqual(blocked.errors, ['无法播放在线发音，请检查网络和浏览器声音设置。'])
  const broken = setup([{ lang: 'en-GB', localService: true }])
  broken.player.speak(word, 0, onlineSettings)
  broken.audios[0].onerror()
  assert.deepEqual(broken.errors, ['在线发音暂时不可用，请检查网络或切换本地音频。'])
  assert.equal(broken.utterances.length, 0)
})

test('changing from local to online invalidates the previous voice callbacks', () => {
  const env = setup([{ lang: 'en-GB', localService: true }])
  let ended = 0
  env.player.speak(word, 0, settings, () => ended++)
  const oldEnd = env.utterances[0].onend
  const oldError = env.utterances[0].onerror
  env.player.speak(word, 1, onlineSettings, () => ended++)
  oldEnd()
  oldError({ error: 'network' })
  assert.equal(ended, 0)
  assert.deepEqual(env.errors, [])
  assert.equal(env.utterances[0].onend, null)
  env.audios[0].onended()
  assert.equal(ended, 1)
})

test('changing from online to local ignores rejected play promises from the old source', async () => {
  const env = setup([{ lang: 'en-GB', localService: true }], true)
  let ended = 0
  env.player.speak(word, 0, onlineSettings, () => ended++)
  const oldEnd = env.audios[0].onended
  env.player.speak(word, 1, settings, () => ended++)
  oldEnd()
  await Promise.resolve()
  assert.equal(ended, 0)
  assert.deepEqual(env.errors, [])
  assert.equal(env.audios[0].paused, true)
  assert.equal(env.audios[0].onended, null)
  env.utterances[0].onend()
  assert.equal(ended, 1)
})

test('disposal detaches callbacks, pauses audio and can survive React strict-effect replay', () => {
  const env = setup()
  env.player.speak(word, 0, onlineSettings)
  env.player.dispose()
  assert.equal(env.audios[0].paused, true)
  assert.equal(env.audios[0].onerror, null)
  assert.deepEqual(env.states, [0])
  env.player.speak(word, 1, onlineSettings)
  assert.deepEqual(env.states, [0, 1])
})
