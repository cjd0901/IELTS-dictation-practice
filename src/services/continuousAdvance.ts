type Timer = ReturnType<typeof setTimeout>
type Clock = {
  now: () => number
  setTimer: (callback: () => void, delay: number) => Timer
  clearTimer: (timer: Timer) => void
}

type PendingWord = {
  index: number
  onAdvance: () => void
  audioEndedAt: number | null
  lastInputAt: number | null
  heldKeys: Set<string>
  composing: boolean
}

const defaultClock: Clock = {
  now: () => performance.now(),
  setTimer: (callback, delay) => setTimeout(callback, delay),
  clearTimer: (timer) => clearTimeout(timer),
}

const WORD_GAP_MS = 2500
const INPUT_IDLE_MS = 2000

/** Coordinates audio completion and editing without interrupting pronunciation. */
export function createContinuousAdvance(clock: Clock = defaultClock) {
  let current: PendingWord | null = null
  let timer: Timer | null = null
  let revision = 0

  function clearPendingTimer() {
    revision++
    if (timer !== null) clock.clearTimer(timer)
    timer = null
  }

  function schedule() {
    clearPendingTimer()
    const word = current
    if (!word || word.audioEndedAt === null || word.composing || word.heldKeys.size) return

    const deadline =
      word.lastInputAt === null
        ? word.audioEndedAt + WORD_GAP_MS
        : Math.max(word.audioEndedAt, word.lastInputAt + INPUT_IDLE_MS)
    const ticket = revision
    timer = clock.setTimer(
      () => {
        if (current !== word || ticket !== revision) return
        timer = null
        current = null
        word.onAdvance()
      },
      Math.max(0, deadline - clock.now()),
    )
  }

  function cancel() {
    clearPendingTimer()
    current = null
  }

  function begin(index: number, onAdvance: () => void) {
    cancel()
    const word: PendingWord = {
      index,
      onAdvance,
      audioEndedAt: null,
      lastInputAt: null,
      heldKeys: new Set(),
      composing: false,
    }
    current = word
    // The captured identity also rejects late audio callbacks after pause/restart.
    return () => {
      if (current !== word || word.audioEndedAt !== null) return
      word.audioEndedAt = clock.now()
      schedule()
    }
  }

  function input(index: number) {
    if (!current || current.index !== index) return
    current.lastInputAt = clock.now()
    schedule()
  }

  function keyDown(index: number, key: string) {
    if (!current || current.index !== index) return
    current.heldKeys.add(key)
    input(index)
  }

  function keyUp(index: number, key: string) {
    if (!current || current.index !== index || !current.heldKeys.delete(key)) return
    input(index)
  }

  function compositionStart(index: number) {
    if (!current || current.index !== index) return
    current.composing = true
    input(index)
  }

  function compositionEnd(index: number) {
    if (!current || current.index !== index) return
    current.composing = false
    input(index)
  }

  function blur(index: number) {
    if (!current || current.index !== index || (!current.heldKeys.size && !current.composing))
      return
    current.heldKeys.clear()
    current.composing = false
    input(index)
  }

  return { begin, input, keyDown, keyUp, compositionStart, compositionEnd, blur, cancel }
}
