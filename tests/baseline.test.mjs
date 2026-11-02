import assert from 'node:assert/strict'
import { test } from 'node:test'
import { legacy } from './helpers/legacy.mjs'

test('frozen vocabulary and session contract', () => {
  assert.equal(legacy.TOTAL, 5873)
  assert.equal(Object.keys(legacy.CHAPTERS).length, 32)
  assert.equal(legacy.newSession().words.length, 20)
  assert.equal(legacy.newSession('3.2', 17).words.length, 18)
  assert.equal(legacy.CHAPTERS['3.2'][0].id, '3.2:0')
  assert.equal(legacy.CHAPTERS['3.2'][0].w, 'bananas')
})

test('frozen normalization and answer acceptance', () => {
  for (const [answer, word, expected] of [
    [' BANANAS ', 'bananas', true],
    ['notice   board', 'notice board', true],
    ['teacher’s', "teacher's", true],
    ['well–known!', 'well-known', true],
    ['colour', 'color / colour', true],
    ['ice cream', 'ice-cream', false],
    ['', 'bananas', false],
    ['banana', 'bananas', false],
  ])
    assert.equal(legacy.isCorrect(answer, { w: word }), expected)
})

test('frozen partial scoring ignores ungraded and empty answers', () => {
  const session = legacy.newSession()
  session.answers[0] = 'bananas'
  session.answers[1] = 'insurance'
  session.checked[0] = true
  assert.equal(legacy.getCorrect(session), 1)
  assert.equal(legacy.getCorrect({ words: session.words, answers: session.answers }), 2)
})

test('frozen daily goal constraints', () => {
  for (const value of [1, 20, Number.MAX_SAFE_INTEGER])
    assert.equal(legacy.isValidDailyGoal(value), true)
  for (const value of [0, -1, 1.5, Infinity, NaN, '20', null])
    assert.equal(legacy.isValidDailyGoal(value), false)
})
