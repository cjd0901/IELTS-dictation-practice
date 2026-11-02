import { Icon } from '../ui/Icon.tsx'
import type { DictationApp } from '../../hooks/useDictationApp.ts'
import { Modal } from '../ui/Modal.tsx'
import { CHAPTERS, chapterTitle, chapterSubtitle } from '../../data/vocabulary.ts'

type Props = Pick<DictationApp, 'setModal' | 'session' | 'startSession'>
export function ChapterDialog(props: Props) {
  const { setModal, session, startSession } = props
  return (
    <Modal title="选择练习章节" wide onClose={() => setModal(null)}>
      <p className="modal-description">按章节循序渐进，每组 20 个词，保持刚刚好的专注。</p>
      <div className="chapter-picker">
        {Object.entries(CHAPTERS).map(([id, words]) => (
          <button
            key={id}
            className={`chapter-option ${session.chapter === id ? 'selected' : ''}`}
            onClick={() => startSession(id)}
          >
            <span className="chapter-option-icon">
              <Icon name="book" />
            </span>
            <span>
              <strong>{chapterTitle(id)}</strong>
              <small>
                第 {id} 节 · {chapterSubtitle(id)}
              </small>
            </span>
            <span className="chapter-word-count">{words.length} 词</span>
            <Icon name={session.chapter === id ? 'check' : 'chevron'} size={16} />
          </button>
        ))}
      </div>
    </Modal>
  )
}
