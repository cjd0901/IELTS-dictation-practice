import { useState } from 'react'
import { VocabularyPreviewDialog } from '../components/dialogs/VocabularyPreviewDialog.tsx'
import { Icon } from '../components/ui/Icon.tsx'
import type { DictationApp } from '../hooks/useDictationApp.ts'
import { CHAPTERS, TOTAL, GROUP_SIZE, chapterTitle, chapterSubtitle } from '../data/vocabulary.ts'

type Props = Pick<DictationApp, 'startSession' | 'settings'>
export function LibraryPage(props: Props) {
  const { startSession, settings } = props
  const [previewChapter, setPreviewChapter] = useState<string | null>(null)
  return (
    <>
      <div className="section-bar">
        <h2>
          王陆雅思语料库 <span className="tag">{TOTAL.toLocaleString()} 词</span>
        </h2>
        <p>32 个小节 · 每组 20 词 · 含音标与中文释义</p>
      </div>
      <div className="library-grid">
        {Object.entries(CHAPTERS).map(([id, words]) => (
          <article className="library-card" key={id}>
            <button
              className="library-card-main"
              aria-label={`开始第 ${id} 节听写`}
              onClick={() => startSession(id)}
            >
              <div className="library-card-top">
                <span className="library-book">
                  <Icon name="book" size={24} />
                </span>
                <span className="tag">{chapterSubtitle(id)}</span>
              </div>
              <h3>{chapterTitle(id)}</h3>
              <p>第 {id} 节</p>
              <div className="library-card-bottom">
                <span>
                  {words.length} 个单词 · {Math.ceil(words.length / GROUP_SIZE)} 组
                </span>
                <Icon name="arrow" size={19} />
              </div>
            </button>
            <button
              className="library-preview-button"
              aria-label={`预习第 ${id} 节词汇`}
              onClick={() => setPreviewChapter(id)}
            >
              <Icon name="book" size={15} />
              预习
            </button>
          </article>
        ))}
      </div>
      {previewChapter !== null && (
        <VocabularyPreviewDialog
          chapter={previewChapter}
          settings={settings}
          onClose={() => setPreviewChapter(null)}
        />
      )}
    </>
  )
}
