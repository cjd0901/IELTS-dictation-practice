import { Icon } from '../ui/Icon.tsx'
import type { DictationApp } from '../../hooks/useDictationApp.ts'
import { VIEW_LABELS } from '../../data/navigation.ts'

type Props = Pick<DictationApp, 'view' | 'storageOk'>
export function Header(props: Props) {
  const { view, storageOk } = props
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>学习空间</span>
        <Icon name="chevron" size={12} />
        <strong>{VIEW_LABELS[view]}</strong>
      </div>
      <div className="topbar-right">
        <span className={`saved ${storageOk ? '' : 'failed'}`}>
          <span />
          {storageOk ? '已自动保存' : '存储空间不足'}
        </span>
        <a
          className="repository-link"
          href="https://github.com/cjd0901/IELTS-dictation-practice"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="打开 GitHub 仓库（新标签页）"
          title="查看 GitHub 仓库"
        >
          <Icon name="github" size={17} />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  )
}
