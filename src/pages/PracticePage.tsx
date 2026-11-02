import { Icon } from '../components/ui/Icon.tsx'
import type { DictationApp } from '../hooks/useDictationApp.ts'
import { CHAPTERS, GROUP_SIZE, chapterTitle, chapterSubtitle } from '../data/vocabulary.ts'
import { isCorrect } from '../utils/grading.ts'
import { WordRow } from '../components/practice/WordRow.tsx'
import { AudioToolbar } from '../components/practice/AudioToolbar.tsx'
import { KeyboardGuide } from '../components/practice/KeyboardGuide.tsx'

type Props = Pick<
  DictationApp,
  | 'session'
  | 'settings'
  | 'setSettings'
  | 'stop'
  | 'continuous'
  | 'toggleContinuous'
  | 'checkedCount'
  | 'shuffle'
  | 'answered'
  | 'correct'
  | 'groupCount'
  | 'active'
  | 'speaking'
  | 'onlyWrong'
  | 'setOnlyWrong'
  | 'bindInput'
  | 'onRowFocus'
  | 'onAnswerChange'
  | 'onRowKeyDown'
  | 'onRowKeyUp'
  | 'onRowBlur'
  | 'onCompositionStart'
  | 'onCompositionEnd'
  | 'playWord'
  | 'reset'
  | 'startSession'
  | 'grade'
  | 'checked'
  | 'setModal'
>
export function PracticePage(props: Props) {
  const {
    session,
    checkedCount,
    answered,
    correct,
    groupCount,
    active,
    speaking,
    onlyWrong,
    setOnlyWrong,
    bindInput,
    onRowFocus,
    onAnswerChange,
    onRowKeyDown,
    onRowKeyUp,
    onRowBlur,
    onCompositionStart,
    onCompositionEnd,
    playWord,
    reset,
    startSession,
    grade,
    checked,
    setModal,
  } = props
  return (
    <>
      <section className="course-banner">
        <div className="course-cover">
          <Icon name="book" size={27} />
          <span>IELTS</span>
        </div>
        <div className="course-info">
          <div className="course-kicker">
            当前词库 <span>IELTS LISTENING</span>
          </div>
          <h2>王陆雅思语料库</h2>
          <p>听力高频词汇，从听懂到写对。</p>
        </div>
        <div className="course-divider" />
        <div className="course-section">
          <small>正在练习</small>
          <strong>{session.review ? '错词专项复习' : chapterTitle(session.chapter)}</strong>
        </div>
        <button className="outline-button" onClick={() => setModal('chapters')}>
          切换章节 <Icon name="chevron" size={14} />
        </button>
      </section>
      <div className="practice-layout">
        <div className="practice-main">
          <section className="practice-card">
            <div className="practice-heading">
              <div>
                <h2>
                  {session.review ? '再听一遍，再记深一点' : `第 ${session.chapter} 节`}
                  <span className="tag">
                    {session.review ? '错词巩固' : chapterSubtitle(session.chapter)}
                  </span>
                </h2>
                <p>
                  {session.review
                    ? '已为你收集本次需要巩固的词汇'
                    : `第 ${session.group + 1} 组，共 ${groupCount} 组`}
                  <span>·</span>本组 {session.words.length} 个单词
                  {session.shuffled && <span className="shuffle-label">乱序</span>}
                </p>
              </div>
              <div className="completion-number">
                <strong>{checkedCount > 0 ? checkedCount : answered}</strong>
                <span> / {session.words.length}</span>
                <small>{checkedCount > 0 ? '已批改' : '已填写'}</small>
              </div>
            </div>
            <div className="practice-progress">
              <i style={{ width: `${(answered / session.words.length) * 100}%` }} />
            </div>
            <AudioToolbar {...props} />
            {checkedCount > 0 && (
              <div className="result-banner" role="status">
                <span className="result-icon">
                  <Icon name="check" size={19} />
                </span>
                <div>
                  <strong>
                    {correct === checkedCount ? '太棒了，全部正确！' : '批改完成，继续积累！'}
                  </strong>
                  <p>
                    正确 {correct} · 错误 {checkedCount - correct} · 正确率{' '}
                    {Math.round((correct / checkedCount) * 100)}%
                  </p>
                </div>
                <button
                  className={`text-button ${onlyWrong ? 'selected' : ''}`}
                  onClick={() => setOnlyWrong(!onlyWrong)}
                >
                  {onlyWrong ? '查看全部' : '只看错词'}
                </button>
              </div>
            )}
            <div className="notebook-heading">
              <span>序号</span>
              <span>{checkedCount > 0 ? '你的答案 / 正确答案与释义' : '单词听写'}</span>
              <span>{checkedCount > 0 ? '仅批改已填写的单词' : '听音后，输入你听到的单词'}</span>
            </div>
            <div className={`word-list ${checkedCount > 0 ? 'graded' : ''}`}>
              {session.words.map((word, i) => {
                const ok = isCorrect(session.answers[i], word)
                if (onlyWrong && (!checked[i] || ok)) return null
                return (
                  <WordRow
                    key={word.id}
                    word={word}
                    index={i}
                    answer={session.answers[i]}
                    checked={checked[i]}
                    active={active === i}
                    speaking={speaking === i}
                    bindInput={bindInput}
                    onFocus={onRowFocus}
                    onAnswerChange={onAnswerChange}
                    onKeyDown={onRowKeyDown}
                    onKeyUp={onRowKeyUp}
                    onBlur={onRowBlur}
                    onCompositionStart={onCompositionStart}
                    onCompositionEnd={onCompositionEnd}
                    onPlay={playWord}
                  />
                )
              })}
              {onlyWrong && correct === checkedCount && (
                <div className="empty-inline">
                  <Icon name="check" size={30} />
                  <p>本组没有错词，继续保持！</p>
                </div>
              )}
            </div>
            <div className="practice-actions">
              <div className="action-hint">
                <span className={speaking !== null ? 'status-dot playing' : 'status-dot'} />
                <span>
                  {speaking !== null ? (
                    `正在播放第 ${speaking + 1} 个单词`
                  ) : checkedCount > 0 ? (
                    '空白行可继续输入，随后再次批改'
                  ) : (
                    <>
                      按 <kbd>Shift + Enter</kbd> 重播
                    </>
                  )}
                </span>
              </div>
              <div className="action-buttons">
                <button className="text-button reset-button" onClick={reset}>
                  <Icon name="reset" size={15} />
                  <span>重新开始</span>
                </button>
                {session.graded ? (
                  <button
                    className="primary-button"
                    disabled={correct === checkedCount}
                    onClick={() =>
                      startSession(
                        session.chapter,
                        session.group,
                        session.words.filter(
                          (word, i) => checked[i] && !isCorrect(session.answers[i], word),
                        ),
                      )
                    }
                  >
                    重练错词 <Icon name="arrow" size={16} />
                  </button>
                ) : (
                  <button className="primary-button" onClick={grade}>
                    <Icon name="check" size={17} />
                    批改<span className="button-shortcut">Ctrl ↵</span>
                  </button>
                )}
              </div>
            </div>
          </section>
          <div className="group-navigation">
            <span>
              {session.review
                ? '专项复习 · 让错词变成熟词'
                : `本组词汇 ${session.group * GROUP_SIZE + 1}–${Math.min((session.group + 1) * GROUP_SIZE, CHAPTERS[session.chapter].length)} / ${CHAPTERS[session.chapter].length}`}
            </span>
            <div>
              <button
                className="group-arrow previous"
                disabled={session.review || session.group === 0}
                onClick={() => startSession(session.chapter, session.group - 1)}
              >
                <Icon name="chevron" size={13} /> 上一组
              </button>
              <select
                aria-label="选择练习分组"
                disabled={session.review}
                value={session.group}
                onChange={(e) => startSession(session.chapter, Number(e.target.value))}
              >
                {Array.from({ length: groupCount }, (_, i) => (
                  <option key={i} value={i}>
                    第 {i + 1} 组
                  </option>
                ))}
              </select>
              <button
                className="group-arrow"
                disabled={session.review || session.group + 1 >= groupCount}
                onClick={() => startSession(session.chapter, session.group + 1)}
              >
                下一组 <Icon name="chevron" size={13} />
              </button>
            </div>
          </div>
        </div>
        <KeyboardGuide />
      </div>
    </>
  )
}
