import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createPronunciationPlayer,
  dictionaryUrl,
  speechText,
} from '../src/services/pronunciation.ts'

const settings = { accent: 'en-GB', rate: 0.8, repeat: 1, auto: false, dailyGoal: 20 }
const word = { id: 'test', w: 'notice board', m: '告示板', p: '' }
function setup(voices = [], audioReject = false, synthesisAvailable = true) {
  const utterances = [],
    audios = [],
    states = [],
    errors = []
  let cancellations = 0
  const synthesis = {
    getVoices: () => voices,
    cancel: () => cancellations++,
    speak: (item) => utterances.push(item),
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
  )
  return { player, utterances, audios, states, errors, cancellations: () => cancellations }
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

test('voice preference is matching local, matching remote, then other English', () => {
  const remote = { lang: 'en-GB', localService: false },
    local = { lang: 'en-GB', localService: true }
  for (const [voices, expected] of [
    [[remote, local], local],
    [[remote], remote],
    [[{ lang: 'en-US' }], { lang: 'en-US' }],
  ]) {
    const env = setup(voices)
    env.player.speak(word, 2, settings)
    assert.deepEqual(env.utterances[0].voice, expected)
    assert.equal(env.utterances[0].rate, 0.8)
    assert.equal(env.utterances[0].text, 'notice board')
  }
})

test('repeats complete exactly once after the requested count', () => {
  const env = setup([{ lang: 'en-GB' }])
  let ended = 0
  env.player.speak(word, 4, { ...settings, repeat: 3 }, () => ended++)
  env.utterances[0].onend()
  env.utterances[1].onend()
  assert.equal(ended, 0)
  env.utterances[2].onend()
  assert.equal(ended, 1)
  assert.deepEqual(env.states, [4, null])
})

test('missing or failed synthesis falls back; deliberate cancellation does not', () => {
  const noVoice = setup()
  noVoice.player.speak(word, 0, settings)
  assert.equal(noVoice.audios.length, 1)
  const noSynthesis = setup([], false, false)
  noSynthesis.player.speak(word, 0, settings)
  assert.equal(noSynthesis.audios.length, 1)
  const env = setup([{ lang: 'en-GB' }])
  env.player.speak(word, 0, settings)
  env.utterances[0].onerror({ error: 'canceled' })
  assert.equal(env.audios.length, 0)
  env.utterances[0].onerror({ error: 'network' })
  assert.equal(env.audios.length, 1)
})

test('new playback and stop invalidate stale completions and fallback errors', async () => {
  const env = setup([], true)
  let ended = 0
  env.player.speak(word, 0, settings, () => ended++)
  const oldEnd = env.audios[0].onended
  env.player.stop()
  oldEnd()
  await Promise.resolve()
  assert.equal(ended, 0)
  assert.deepEqual(env.errors, [])
  assert.equal(env.audios[0].paused, true)
  assert.equal(env.audios[0].onended, null)
})

test('audio failures preserve both existing user messages', async () => {
  const blocked = setup([], true)
  blocked.player.speak(word, 0, settings)
  await Promise.resolve()
  assert.deepEqual(blocked.errors, ['无法播放发音，请检查网络和浏览器声音设置。'])
  const broken = setup()
  broken.player.speak(word, 0, settings)
  broken.audios[0].onerror()
  assert.deepEqual(broken.errors, ['发音暂时不可用，请检查网络或切换浏览器语音。'])
})

test('disposal detaches callbacks, pauses audio and can survive React strict-effect replay', () => {
  const env = setup()
  env.player.speak(word, 0, settings)
  env.player.dispose()
  assert.equal(env.audios[0].paused, true)
  assert.equal(env.audios[0].onerror, null)
  assert.deepEqual(env.states, [0])
  env.player.speak(word, 1, settings)
  assert.deepEqual(env.states, [0, 1])
})
