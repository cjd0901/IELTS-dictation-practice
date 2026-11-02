import { Icon } from '../ui/Icon.tsx'
import type { DictationApp } from '../../hooks/useDictationApp.ts'
import type { Settings } from '../../types/study.ts'

type Props = Pick<
  DictationApp,
  | 'settings'
  | 'setSettings'
  | 'stop'
  | 'continuous'
  | 'toggleContinuous'
  | 'session'
  | 'checkedCount'
  | 'shuffle'
>
export function AudioToolbar(props: Props) {
  const {
    settings,
    setSettings,
    stop,
    continuous,
    toggleContinuous,
    session,
    checkedCount,
    shuffle,
  } = props
  return (
    <div className="audio-toolbar">
      <div className="toolbar-select">
        <Icon name="volume" size={16} />
        <select
          aria-label="发音口音"
          value={settings.accent}
          onChange={(e) => {
            stop()
            setSettings({ ...settings, accent: e.target.value as Settings['accent'] })
          }}
        >
          <option value="en-GB">英式发音</option>
          <option value="en-US">美式发音</option>
        </select>
      </div>
      <select
        className="audio-source-select"
        aria-label="发音来源"
        value={settings.audioSource}
        onChange={(e) => {
          stop()
          setSettings({ ...settings, audioSource: e.target.value as Settings['audioSource'] })
        }}
      >
        <option value="local">本地音频</option>
        <option value="online">在线音频（有道）</option>
      </select>
      <span className="toolbar-divider" />
      <select
        className="speed-select"
        aria-label="播放语速"
        value={settings.rate}
        onChange={(e) => {
          stop()
          setSettings({ ...settings, rate: Number(e.target.value) })
        }}
      >
        <option value={0.7}>0.7×</option>
        <option value={0.8}>0.8×</option>
        <option value={1}>1.0×</option>
        <option value={1.2}>1.2×</option>
      </select>
      <button className={`toolbar-button ${continuous ? 'on' : ''}`} onClick={toggleContinuous}>
        <Icon name={continuous ? 'pause' : 'play'} size={13} />
        {continuous ? '暂停连播' : '连续播放'}
      </button>
      <button
        className={`auto-control ${settings.auto ? 'on' : ''}`}
        role="switch"
        aria-checked={settings.auto}
        onClick={() => setSettings({ ...settings, auto: !settings.auto })}
      >
        <span className="switch-track">
          <i />
        </span>
        自动发音
      </button>
      <button
        className={`shuffle-button ${session.shuffled ? 'on' : ''}`}
        onClick={shuffle}
        disabled={checkedCount > 0}
        title="打乱当前组顺序"
      >
        <Icon name="shuffle" size={16} />
        <span>乱序</span>
      </button>
    </div>
  )
}
