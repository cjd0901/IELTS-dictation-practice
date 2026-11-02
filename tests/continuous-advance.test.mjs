import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createContinuousAdvance } from '../src/services/continuousAdvance.ts'
import { isAnswerEditingKey } from '../src/utils/shortcuts.ts'

function setup() {
  let now = 0,
    id = 0,
    count = 0
  const timers = new Map()
  const gate = createContinuousAdvance({
    now: () => now,
    setTimer(callback, delay) {
      const key = ++id
      timers.set(key, { callback, at: now + delay })
      return key
    },
    clearTimer(key) {
      timers.delete(key)
    },
  })
  function tick(milliseconds) {
    const end = now + milliseconds
    for (;;) {
      const next = [...timers]
        .filter(([, timer]) => timer.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0]
      if (!next) break
      now = next[1].at
      timers.delete(next[0])
      next[1].callback()
    }
    now = end
  }
  return {
    gate,
    tick,
    timers,
    count: () => count,
    begin: (index = 0) => gate.begin(index, () => count++),
  }
}

test('without input, retain the 2.5-second interval after audio finishes', () => {
  const env = setup()
  const end = env.begin()
  env.tick(10000)
  assert.equal(env.count(), 0)
  end()
  env.tick(2499)
  assert.equal(env.count(), 0)
  env.tick(1)
  assert.equal(env.count(), 1)
  end()
  env.tick(10000)
  assert.equal(env.count(), 1)
})

test('each edit replaces the pending interval with two seconds of input inactivity', () => {
  const env = setup()
  env.begin()()
  env.tick(2000)
  env.gate.input(0)
  env.tick(1999)
  assert.equal(env.count(), 0)
  env.gate.input(0)
  env.tick(1999)
  assert.equal(env.count(), 0)
  env.tick(1)
  assert.equal(env.count(), 1)
})

test('held editing keys wait for keyup, including deletion without a value change', () => {
  const env = setup()
  env.begin()()
  env.tick(2000)
  env.gate.keyDown(0, 'Backspace')
  env.tick(5000)
  assert.equal(env.count(), 0)
  env.gate.keyUp(0, 'Backspace')
  env.tick(1999)
  assert.equal(env.count(), 0)
  env.tick(1)
  assert.equal(env.count(), 1)
})

test('multiple held keys must all be released before the idle countdown begins', () => {
  const env = setup()
  env.begin()()
  env.gate.keyDown(0, 'KeyA')
  env.gate.keyDown(0, 'KeyB')
  env.gate.keyUp(0, 'KeyA')
  env.tick(3000)
  assert.equal(env.count(), 0)
  env.gate.keyUp(0, 'KeyB')
  env.tick(2000)
  assert.equal(env.count(), 1)
})

test('input never interrupts an unfinished word, including slow or repeated pronunciation', () => {
  const env = setup()
  const end = env.begin()
  env.gate.input(0)
  env.tick(5000)
  assert.equal(env.count(), 0)
  end()
  env.tick(0)
  assert.equal(env.count(), 1)
})

test('audio finishing during input still waits for the remaining input-idle period', () => {
  const env = setup()
  const end = env.begin()
  env.tick(1000)
  env.gate.input(0)
  env.tick(500)
  end()
  env.tick(1499)
  assert.equal(env.count(), 0)
  env.tick(1)
  assert.equal(env.count(), 1)
})

test('composition blocks advancing until commitment plus two seconds', () => {
  const env = setup()
  const end = env.begin()
  env.gate.compositionStart(0)
  end()
  env.tick(5000)
  env.gate.input(0)
  env.tick(5000)
  assert.equal(env.count(), 0)
  env.gate.compositionEnd(0)
  env.tick(1999)
  assert.equal(env.count(), 0)
  env.tick(1)
  assert.equal(env.count(), 1)
})

test('blur releases keys whose keyup happened outside the current input', () => {
  const env = setup()
  env.begin()()
  env.gate.keyDown(0, 'KeyA')
  env.tick(1000)
  env.gate.blur(0)
  env.tick(1999)
  assert.equal(env.count(), 0)
  env.tick(1)
  assert.equal(env.count(), 1)
})

test('typing in another row does not delay the current continuous word', () => {
  const env = setup()
  env.begin()()
  env.tick(2000)
  env.gate.input(1)
  env.gate.keyDown(1, 'KeyA')
  env.gate.compositionStart(1)
  env.tick(500)
  assert.equal(env.count(), 1)
})

test('pause or restart invalidates cleared timers and stale audio completion', () => {
  const env = setup()
  const oldEnd = env.begin()
  oldEnd()
  const oldTimer = [...env.timers.values()][0].callback
  env.gate.cancel()
  oldTimer()
  oldEnd()
  env.tick(5000)
  assert.equal(env.count(), 0)
  const newEnd = env.begin()
  oldEnd()
  env.tick(5000)
  assert.equal(env.count(), 0)
  newEnd()
  env.tick(2500)
  assert.equal(env.count(), 1)
})

test('an obsolete idle timer cannot override a newer keystroke deadline', () => {
  const env = setup()
  env.begin()()
  const oldTimer = [...env.timers.values()][0].callback
  env.tick(1000)
  env.gate.input(0)
  oldTimer()
  env.tick(1999)
  assert.equal(env.count(), 0)
  env.tick(1)
  assert.equal(env.count(), 1)
})

test('only answer-editing keys affect idle timing, not shortcuts or navigation', () => {
  const modifiers = { ctrlKey: false, metaKey: false, altKey: false }
  for (const key of ['a', 'A', ' ', 'Backspace', 'Delete'])
    assert.equal(isAnswerEditingKey({ ...modifiers, key }), true)
  for (const key of ['Enter', 'ArrowDown', 'ArrowUp', 'Shift', 'Control', 'Tab'])
    assert.equal(isAnswerEditingKey({ ...modifiers, key }), false)
  assert.equal(isAnswerEditingKey({ ...modifiers, key: 'v', ctrlKey: true }), false)
})
