import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveGlobalShortcut } from '../src/utils/shortcuts.ts'

const key = {
  key: 'Enter',
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  isComposing: false,
}

test('all modifier combinations retain shortcut priority and composition/modal gating', () => {
  for (let mask = 0; mask < 16; mask++) {
    const event = {
      ...key,
      ctrlKey: !!(mask & 1),
      metaKey: !!(mask & 2),
      shiftKey: !!(mask & 4),
      altKey: !!(mask & 8),
    }
    const expected =
      event.ctrlKey || event.metaKey ? 'grade' : event.shiftKey && !event.altKey ? 'replay' : null
    assert.equal(resolveGlobalShortcut(event, true, true), expected)
    assert.equal(resolveGlobalShortcut(event, false, true), null)
    assert.equal(resolveGlobalShortcut({ ...event, isComposing: true }, true, true), null)
  }
  assert.equal(resolveGlobalShortcut({ ...key, shiftKey: true }, true, false), null)
  assert.equal(resolveGlobalShortcut({ ...key, key: ' ', shiftKey: false }, true, true), null)
})
