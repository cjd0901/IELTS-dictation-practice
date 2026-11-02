import { useState } from 'react'
import { CHAPTERS, chapterTitle } from '../../data/vocabulary.ts'
import { usePronunciation } from '../../hooks/usePronunciation.ts'
import type { Settings } from '../../types/study.ts'
import { Icon } from '../ui/Icon.tsx'
import { Modal } from '../ui/Modal.tsx'
import { Wave } from '../ui/Wave.tsx'

type Props = { chapter: string; settings: Settings; onClose: () => void }

export function VocabularyPreviewDialog({ chapter, settings, onClose }: Props) {
  const words = CHAPTERS[chapter]
  const [error, setError] = useState('')
  const { speaking, pronounce } = usePronunciation(settings, setError)
  return (
    <Modal title={`第 ${chapter} 节 · 词汇预习`} wide onClose={onClose}>
      <p className="modal-description">
        {chapterTitle(chapter)} · 全部 {words.length} 个词汇
      </p>
      {error && (
        <p className="preview-error" role="alert">
          {error}
        </p>
      )}
      <ol
        className="preview-word-list"
        role="list"
        tabIndex={0}
        aria-label={`第 ${chapter} 节全部词汇`}
      >
        {words.map((word, index) => (
          <li className="preview-word" key={word.id}>
            <span className="preview-word-number" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <strong lang="en">{word.w}</strong>
              {word.p && <small>/{word.p}/</small>}
            </div>
            <span className="preview-word-meaning">{word.m}</span>
            <button
              className={`icon-button preview-word-sound ${speaking === index ? 'playing' : ''}`}
              aria-label={`播放 ${word.w}`}
              title={speaking === index ? '正在播放，点击重播' : '播放发音'}
              onClick={() => {
                setError('')
                pronounce(word, index)
              }}
            >
              {speaking === index ? <Wave small /> : <Icon name="volume" size={18} />}
            </button>
          </li>
        ))}
      </ol>
    </Modal>
  )
}
