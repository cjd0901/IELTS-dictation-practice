import assert from 'node:assert/strict'
import { test } from 'node:test'
import { downloadHistory, serializeHistory } from '../src/services/exportHistory.ts'

test('export preserves payload keys, pretty printing and data', () => {
  const history = [{ id: 'saved', answers: ['wrong answer'], correct: 0 }]
  const mistakes = [{ id: '3.2:0', w: 'bananas', m: '香蕉', p: '' }]
  assert.equal(
    serializeHistory(history, mistakes, 'date'),
    JSON.stringify({ exportedAt: 'date', history, mistakes }, null, 2),
  )
})

test('download keeps filename, MIME, 1-second lifetime and idempotent cleanup', () => {
  const originals = {
    document: globalThis.document,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    create: URL.createObjectURL,
    revoke: URL.revokeObjectURL,
  }
  const link = {
    clickCount: 0,
    click() {
      this.clickCount++
    },
  }
  let blob,
    callback,
    delay,
    revoked = 0,
    finished = 0
  globalThis.document = { createElement: () => link }
  globalThis.setTimeout = (fn, milliseconds) => {
    callback = fn
    delay = milliseconds
    return 1
  }
  globalThis.clearTimeout = () => {}
  URL.createObjectURL = (value) => {
    blob = value
    return 'blob:test'
  }
  URL.revokeObjectURL = (value) => {
    assert.equal(value, 'blob:test')
    revoked++
  }
  try {
    const cleanup = downloadHistory([], [], '2026-11-02', () => finished++)
    assert.equal(link.download, '听见-学习记录-2026-11-02.json')
    assert.equal(link.clickCount, 1)
    assert.equal(blob.type, 'application/json')
    assert.equal(delay, 1000)
    callback()
    cleanup()
    cleanup()
    assert.equal(revoked, 1)
    assert.equal(finished, 1)
  } finally {
    globalThis.document = originals.document
    globalThis.setTimeout = originals.setTimeout
    globalThis.clearTimeout = originals.clearTimeout
    URL.createObjectURL = originals.create
    URL.revokeObjectURL = originals.revoke
  }
})
