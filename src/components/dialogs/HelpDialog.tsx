import { Icon } from '../ui/Icon.tsx'
import type { DictationApp } from '../../hooks/useDictationApp.ts'
import { Modal } from '../ui/Modal.tsx'

type Props = Pick<DictationApp, 'setModal'>
export function HelpDialog(props: Props) {
  const { setModal } = props
  return (
    <Modal title="把注意力留给听写" onClose={() => setModal(null)}>
      <p className="modal-description">点击一行输入框，按 Shift + Enter 播放，输入你听到的单词。</p>
      <div className="help-list">
        {[
          ['Shift + Enter', '播放或重播光标所在行的单词'],
          ['Space', '输入短语中的空格'],
          ['Enter', '换到下一行；↑ 可返回上一行'],
          ['Ctrl + Enter', '仅批改已填写的行，展开答案、音标与中文释义'],
          ['↑ / ↓', '在单词行之间移动光标'],
        ].map(([key, text]) => (
          <div key={key}>
            <kbd>{key}</kbd>
            <span>{text}</span>
          </div>
        ))}
      </div>
      <div className="help-note">
        仅批改已填写的行。空白行不计入成绩、不收进错词本，可继续输入后再次批改。Mac 可使用 ⌘ + Enter
        批改。输入与学习记录会自动保存在当前浏览器。
      </div>
      <button className="primary-button full-width" onClick={() => setModal(null)}>
        明白了，开始专注 <Icon name="headphones" size={17} />
      </button>
    </Modal>
  )
}
