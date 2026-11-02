type KeyStroke = {
  key: string
  isComposing: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
}

export function isAnswerEditingKey(
  event: Pick<KeyStroke, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'>,
) {
  return (
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete')
  )
}

export function resolveGlobalShortcut(event: KeyStroke, enabled: boolean, inputOrBody: boolean) {
  if (!enabled || event.isComposing) return null
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') return 'grade'
  if (
    event.key === 'Enter' &&
    event.shiftKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    inputOrBody
  )
    return 'replay'
  return null
}
