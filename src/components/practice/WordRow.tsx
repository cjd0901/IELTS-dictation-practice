import { memo, useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import type { Word } from '../../types/study.ts'
import { isCorrect } from '../../utils/grading.ts'
import { Icon } from '../ui/Icon.tsx'
import { Wave } from '../ui/Wave.tsx'

type Props = {
  word: Word
  index: number
  answer: string
  checked: boolean
  active: boolean
  speaking: boolean
  bindInput: (index: number, element: HTMLInputElement | null) => void
  onFocus: (index: number) => void
  onAnswerChange: (index: number, value: string) => void
  onKeyDown: (index: number, event: KeyboardEvent<HTMLInputElement>) => void
  onKeyUp: (index: number, event: KeyboardEvent<HTMLInputElement>) => void
  onBlur: (index: number) => void
  onCompositionStart: (index: number) => void
  onCompositionEnd: (index: number) => void
  onPlay: (index: number) => void
}

export const WordRow = memo(function WordRow({
  word,
  index,
  answer,
  checked,
  active,
  speaking,
  bindInput,
  onFocus,
  onAnswerChange,
  onKeyDown,
  onKeyUp,
  onBlur,
  onCompositionStart,
  onCompositionEnd,
  onPlay,
}: Props) {
  const ok = isCorrect(answer, word)
  const inputRef = useCallback(
    (element: HTMLInputElement | null) => bindInput(index, element),
    [bindInput, index],
  )

  return (
    <div
      className={`word-row ${active ? 'current' : ''} ${checked ? (ok ? 'correct' : 'incorrect') : ''}`}
    >
      <span className="row-number">{String(index + 1).padStart(2, '0')}</span>
      <div className="word-field">
        <input
          ref={inputRef}
          aria-label={`第 ${index + 1} 个单词`}
          aria-invalid={checked && !ok}
          value={answer}
          placeholder={checked ? '未填写' : index === 0 ? '点击此处，开始输入…' : '输入听到的单词'}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          readOnly={checked}
          onFocus={() => onFocus(index)}
          onChange={(event) => onAnswerChange(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onKeyUp={(event) => onKeyUp(index, event)}
          onBlur={() => onBlur(index)}
          onCompositionStart={() => {
            if (!checked) onCompositionStart(index)
          }}
          onCompositionEnd={() => {
            if (!checked) onCompositionEnd(index)
          }}
        />
        {checked && (
          <div className="word-answer">
            <strong>{word.w}</strong>
            <span className="phonetic">/{word.p}/</span>
            <span className="word-meaning">{word.m}</span>
          </div>
        )}
      </div>
      {checked && (
        <span className={`row-verdict ${ok ? 'right' : 'wrong'}`} aria-label={ok ? '正确' : '错误'}>
          <Icon name={ok ? 'check' : 'close'} size={16} />
        </span>
      )}
      <button
        className={`row-sound ${speaking ? 'playing' : ''}`}
        onClick={() => onPlay(index)}
        aria-label={`播放第 ${index + 1} 个单词`}
        title="播放单词（Shift + Enter）"
      >
        {speaking ? <Wave small /> : <Icon name="volume" size={18} />}
      </button>
    </div>
  )
})
