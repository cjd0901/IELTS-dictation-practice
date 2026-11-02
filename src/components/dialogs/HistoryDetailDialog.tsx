import { Icon } from '../ui/Icon.tsx'
import type { DictationApp } from '../../hooks/useDictationApp.ts'
import { Modal } from '../ui/Modal.tsx'
import { isCorrect } from '../../utils/grading.ts'

type Props = Pick<DictationApp, 'detail' | 'setDetail'>
export function HistoryDetailDialog(props: Props) {
  const { detail, setDetail } = props
  if (!detail) return null
  return (
    <Modal title="听写记录" wide onClose={() => setDetail(null)}>
      <p className="modal-description">
        {new Date(detail.date).toLocaleString('zh-CN')} · 正确 {detail.correct} /{' '}
        {detail.words.length}
      </p>
      <div className="record-detail">
        {detail.words.map((word, i) => (
          <div
            className={`detail-word ${isCorrect(detail.answers[i], word) ? 'ok' : 'bad'}`}
            key={`${word.id}-${i}`}
          >
            <Icon name={isCorrect(detail.answers[i], word) ? 'check' : 'close'} size={17} />
            <div>
              <strong>{word.w}</strong>
              <small>你的答案：{detail.answers[i] || '未填写'}</small>
            </div>
            <span>{word.m}</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}
