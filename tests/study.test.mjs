import assert from 'node:assert/strict'
import { test } from 'node:test'
import { legacy } from './helpers/legacy.mjs'
import * as current from '../src/lib.ts'
import {
  gradePending,
  updateMistakes,
  shuffleSession,
  migrateLegacyHistory,
} from '../src/utils/session.ts'
import { getLearningStats } from '../src/utils/statistics.ts'
import { addHistoryEntry } from '../src/utils/session.ts'

test('history retains only the newest 100 per-submission records without mutating the input', () => {
  const entries = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }))
  const next = addHistoryEntry(entries, { id: 'latest' })
  assert.equal(next.length, 100)
  assert.equal(next[0].id, 'latest')
  assert.equal(next.at(-1).id, '98')
  assert.equal(entries.at(-1).id, '99')
})

function withStorage(value, action, throws = false) {
  const previous = globalThis.localStorage
  const entries = new Map(Object.entries(value))
  globalThis.localStorage = {
    getItem(key) {
      if (throws) throw Error('denied')
      return entries.get(key) ?? null
    },
    setItem(key, data) {
      if (throws) throw Error('quota')
      entries.set(key, data)
    },
  }
  try {
    return action(entries)
  } finally {
    globalThis.localStorage = previous
  }
}

test('all 5,873 vocabulary entries, IDs and chapter metadata remain identical', () => {
  assert.deepEqual(current.CHAPTERS, legacy.CHAPTERS)
  for (const chapter of Object.keys(legacy.CHAPTERS)) {
    assert.equal(current.chapterTitle(chapter), legacy.chapterTitle(chapter))
    assert.equal(current.chapterSubtitle(chapter), legacy.chapterSubtitle(chapter))
    for (let group = 0; group < Math.ceil(legacy.CHAPTERS[chapter].length / 20); group++) {
      assert.deepEqual(current.newSession(chapter, group), legacy.newSession(chapter, group))
    }
  }
})

test('answer normalization matches the frozen implementation across the entire vocabulary', () => {
  for (const words of Object.values(legacy.CHAPTERS))
    for (const word of words) {
      for (const answer of [
        word.w,
        `  ${word.w.toUpperCase()}  `,
        word.w.replaceAll(' ', '   '),
        '',
        `${word.w}x`,
      ]) {
        assert.equal(
          current.isCorrect(answer, word),
          legacy.isCorrect(answer, word),
          `${word.id}: ${answer}`,
        )
        assert.equal(current.normalize(answer), legacy.normalize(answer))
      }
    }
})

test('storage keeps key prefix, payload and parse/quota fallbacks', () => {
  withStorage({ 'tingjian:bad': '{' }, (entries) => {
    assert.equal(current.load('missing', 42), 42)
    assert.equal(current.load('bad', 42), 42)
    assert.equal(current.save('settings', { dailyGoal: 30 }), true)
    assert.equal(entries.get('tingjian:settings'), '{"dailyGoal":30}')
    assert.deepEqual(current.load('settings', {}), { dailyGoal: 30 })
  })
  withStorage(
    {},
    () => {
      assert.equal(current.load('session', null), null)
      assert.equal(current.save('session', {}), false)
    },
    true,
  )
})

test('old and current session restoration match exactly', () => {
  const session = legacy.newSession()
  session.answers[0] = 'bananas'
  for (const value of [
    null,
    {},
    session,
    { ...session, checked: undefined, graded: true },
    { ...session, chapter: 'missing' },
  ]) {
    withStorage({ 'tingjian:session': JSON.stringify(value) }, () => {
      assert.deepEqual(current.restoreSession(), legacy.restoreSession())
    })
  }
})

test('partial grading, subsequent grading and no-op submission preserve exact records', () => {
  const session = current.newSession()
  assert.equal(gradePending(session, 'first', '2026-11-02T01:00:00.000Z'), null)
  session.answers[0] = ' BANANAS '
  session.answers[1] = 'wrong answer'
  session.answers[2] = '   '
  const first = gradePending(session, 'first', '2026-11-02T01:00:00.000Z')
  assert.deepEqual(first.entry, {
    id: 'first',
    date: '2026-11-02T01:00:00.000Z',
    chapter: '3.2',
    group: 0,
    words: session.words.slice(0, 2),
    answers: [' BANANAS ', 'wrong answer'],
    correct: 1,
    review: false,
  })
  assert.equal(first.graded, false)
  assert.equal(first.checked.filter(Boolean).length, 2)
  const next = { ...session, checked: first.checked }
  assert.equal(gradePending(next, 'duplicate', 'date'), null)
  next.answers[2] = 'town'
  const second = gradePending(next, 'second', 'date')
  assert.deepEqual(second.entry.words, [session.words[2]])
  assert.equal(second.entry.correct, 1)
  assert.equal(second.checked.filter(Boolean).length, 3)
})

test('finishing a group and reviewing mistakes keep completion and IDs', () => {
  const session = current.newSession('4.4')
  session.answers = session.words.map((word) => word.w)
  const result = gradePending(session, 'all', 'date')
  assert.equal(result.graded, true)
  assert.equal(result.entry.correct, session.words.length)
  const words = session.words.slice(0, 2)
  assert.equal(current.newSession('4.4', 0, words).review, true)
  assert.deepEqual(updateMistakes([words[0]], words, [words[0].w, 'wrong']), [words[1]])
  assert.deepEqual(updateMistakes([words[1]], words, ['wrong', 'wrong']), [words[1], words[0]])
})

test('shuffle keeps answer-word association, input immutability and random draw count', () => {
  const session = current.newSession()
  session.answers = session.words.map((word) => word.id)
  const before = structuredClone(session)
  let calls = 0
  const shuffled = shuffleSession(session, () => {
    calls++
    return 0.25
  })
  assert.equal(calls, session.words.length - 1)
  assert.deepEqual(session, before)
  assert.notDeepEqual(shuffled.words, session.words)
  shuffled.words.forEach((word, index) => assert.equal(shuffled.answers[index], word.id))
  assert.equal(shuffled.shuffled, true)
  assert.equal(shuffled.checked.some(Boolean), false)
})

test('legacy history migration skips blanks without removing attempted mistakes', () => {
  const session = current.newSession()
  const entry = {
    id: 'old',
    date: 'date',
    chapter: '3.2',
    group: 0,
    review: false,
    words: session.words.slice(0, 3),
    answers: ['bananas', '', 'wrong'],
    correct: 1,
  }
  const result = migrateLegacyHistory([entry])
  assert.equal(result.history[0].words.length, 2)
  assert.equal(result.history[0].correct, 1)
  assert.deepEqual([...result.blankOnlyIds], ['3.2:1'])
  assert.equal(migrateLegacyHistory(result.history), null)
})

test('local-date stats, per-submission counts and empty-history outputs are unchanged', () => {
  assert.deepEqual(getLearningStats([], '2026-11-02'), { practiced: 0, todayCount: 0, accuracy: 0 })
  const words = current.newSession().words.slice(0, 2)
  const history = [
    { date: '2026-11-02T12:00:00', words, correct: 1 },
    { date: '2026-11-01T12:00:00', words, correct: 2 },
  ]
  assert.deepEqual(getLearningStats(history, '2026-11-02'), {
    practiced: 4,
    todayCount: 2,
    accuracy: 75,
  })
})

test('daily goal boundaries retain original validation', () => {
  for (const value of [
    undefined,
    null,
    '',
    '5',
    -1,
    0,
    0.5,
    1,
    20,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER,
  ]) {
    assert.equal(current.isValidDailyGoal(value), legacy.isValidDailyGoal(value))
  }
})
