import { useMemo } from 'react'
import { EmptyState } from '../components/ui/EmptyState.tsx'
import { Icon } from '../components/ui/Icon.tsx'
import type { DictationApp } from '../hooks/useDictationApp.ts'

type Props = Pick<
  DictationApp,
  | 'mistakes'
  | 'startSession'
  | 'session'
  | 'query'
  | 'setQuery'
  | 'stop'
  | 'pronounce'
  | 'changeView'
>
export function MistakesPage(props: Props) {
  const { mistakes, startSession, session, query, setQuery, stop, pronounce, changeView } = props
  const visibleMistakes = useMemo(() => {
    const normalizedQuery = query.toLowerCase()
    return mistakes.filter((word) => `${word.w} ${word.m}`.toLowerCase().includes(normalizedQuery))
  }, [mistakes, query])
  return (
    <>
      <div className="section-bar">
        <h2>
          需要再听一遍的词 <span className="tag">{mistakes.length}</span>
        </h2>
        <button
          className="primary-button"
          disabled={!mistakes.length}
          onClick={() => startSession(session.chapter, 0, mistakes.slice(0, 20))}
        >
          <Icon name="play" size={14} /> 专项听写（最多 20 词）
        </button>
      </div>
      {mistakes.length ? (
        <>
          <div className="search-box">
            <Icon name="search" size={18} />
            <input
              aria-label="搜索错词"
              placeholder="搜索单词或中文释义…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="review-table">
            {visibleMistakes.map((word, i) => (
              <div className="review-word" key={word.id}>
                <span className="row-number">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{word.w}</strong>
                  <small>/{word.p}/</small>
                </div>
                <span>{word.m}</span>
                <button
                  className="icon-button"
                  aria-label={`播放 ${word.w}`}
                  onClick={() => {
                    stop()
                    pronounce(word, i)
                  }}
                >
                  <Icon name="volume" size={18} />
                </button>
              </div>
            ))}
          </div>
          <p className="table-note">在专项听写中答对的单词，会自动移出错词本。</p>
        </>
      ) : (
        <EmptyState
          icon="mistakes"
          title="还没有错词，就是一个好开始"
          description="完成听写后，需要巩固的词会自动出现在这里。"
          onStart={() => changeView('practice')}
        />
      )}
    </>
  )
}
