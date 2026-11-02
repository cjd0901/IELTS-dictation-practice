import { EmptyState } from '../components/ui/EmptyState.tsx'
import { Icon } from '../components/ui/Icon.tsx'
import type { DictationApp } from '../hooks/useDictationApp.ts'

type Props = Pick<
  DictationApp,
  'practiced' | 'history' | 'accuracy' | 'exportHistory' | 'setDetail' | 'changeView'
>
export function HistoryPage(props: Props) {
  const { practiced, history, accuracy, exportHistory, setDetail, changeView } = props
  return (
    <>
      <div className="history-stats">
        <div>
          <span>累计听写</span>
          <strong>
            {practiced}
            <small>词</small>
          </strong>
        </div>
        <div>
          <span>练习次数</span>
          <strong>
            {history.length}
            <small>次</small>
          </strong>
        </div>
        <div>
          <span>平均正确率</span>
          <strong>
            {accuracy}
            <small>%</small>
          </strong>
        </div>
      </div>
      <div className="section-bar">
        <h2>每一次练习</h2>
        <button className="outline-button" disabled={!history.length} onClick={exportHistory}>
          <Icon name="download" size={16} />
          导出记录
        </button>
      </div>
      {history.length ? (
        <div className="history-table">
          <div className="history-row history-header">
            <span>练习时间</span>
            <span>练习内容</span>
            <span>正确词数</span>
            <span>正确率</span>
            <span />
          </div>
          {history.map((entry) => (
            <button className="history-row" key={entry.id} onClick={() => setDetail(entry)}>
              <span>
                {new Date(entry.date).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>
                {entry.review
                  ? '错词专项复习'
                  : `第 ${entry.chapter} 节 · 第 ${entry.group + 1} 组`}
              </span>
              <span>
                {entry.correct} / {entry.words.length}
              </span>
              <span className="history-score">
                {Math.round((entry.correct / entry.words.length) * 100)}%
              </span>
              <Icon name="chevron" size={16} />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="history"
          title="你的进步，从第一次听写开始"
          description="完成一组批改，就能在这里回顾结果。"
          onStart={() => changeView('practice')}
        />
      )}
    </>
  )
}
