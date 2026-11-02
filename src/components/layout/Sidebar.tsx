import { Icon } from '../ui/Icon.tsx'
import type { DictationApp } from '../../hooks/useDictationApp.ts'
import { Wave } from '../ui/Wave.tsx'
import { TOTAL } from '../../data/vocabulary.ts'

type Props = Pick<
  DictationApp,
  'view' | 'changeView' | 'mistakes' | 'setModal' | 'todayCount' | 'dailyGoal'
>
export function Sidebar(props: Props) {
  const { view, changeView, mistakes, setModal, todayCount, dailyGoal } = props
  return (
    <aside className="sidebar">
      <a
        className="brand"
        href="#"
        aria-label="雅思听写练习首页"
        onClick={(e) => {
          e.preventDefault()
          changeView('practice')
        }}
      >
        <span className="brand-mark">
          <Wave small />
        </span>
        <span className="brand-title">雅思听写练习</span>
      </a>
      <div className="sidebar-label">
        学习空间 <span>WORKSPACE</span>
      </div>
      <nav aria-label="主导航">
        {(
          [
            { id: 'practice', name: '听写练习', icon: 'headphones' },
            { id: 'library', name: '我的词库', icon: 'book' },
            { id: 'mistakes', name: '错词本', icon: 'mistakes' },
            { id: 'history', name: '学习记录', icon: 'history' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            className={`nav-item ${view === item.id ? 'active' : ''}`}
            onClick={() => changeView(item.id)}
          >
            <Icon name={item.icon} />
            <span>{item.name}</span>
            {item.id === 'mistakes' && mistakes.length > 0 ? (
              <b>{mistakes.length}</b>
            ) : item.id === 'practice' ? (
              <span className="nav-active-dot" />
            ) : null}
          </button>
        ))}
      </nav>
      <div className="sidebar-library">
        <div className="sidebar-label">正在学习</div>
        <button onClick={() => setModal('chapters')}>
          <span className="mini-book">
            <Icon name="book" size={19} />
          </span>
          <span>
            王陆雅思语料库<small>{TOTAL.toLocaleString()} 个词汇 · 系统练习</small>
          </span>
          <Icon name="chevron" size={13} />
        </button>
      </div>
      <div className="sidebar-bottom">
        <div className="daily-goal">
          <div className="goal-top">
            <span>
              <Icon name="leaf" size={16} /> 今日小目标
            </span>
            <b>
              {Math.min(todayCount, dailyGoal)}
              <em> / {dailyGoal}</em>
            </b>
          </div>
          <div className="progress-track">
            <i style={{ width: `${Math.min((todayCount / dailyGoal) * 100, 100)}%` }} />
          </div>
          {todayCount >= dailyGoal && <p>今天的目标已完成，做得很好。</p>}
        </div>
        <button className="sidebar-settings" onClick={() => setModal('settings')}>
          <Icon name="settings" size={18} /> 偏好设置 <span>↗</span>
        </button>
        <div className="local-note">
          <span /> 数据仅保存本地
        </div>
      </div>
    </aside>
  )
}
