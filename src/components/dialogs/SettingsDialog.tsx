import { Icon } from '../ui/Icon.tsx'
import type { DictationApp } from '../../hooks/useDictationApp.ts'
import { useState } from 'react'
import type { Settings } from '../../types/study.ts'
import { isValidDailyGoal } from '../../utils/settings.ts'
import { Modal } from '../ui/Modal.tsx'

type Props = Pick<
  DictationApp,
  'setModal' | 'settings' | 'setSettings' | 'dailyGoal' | 'stop' | 'pronounce' | 'notify'
>
export function SettingsDialog(props: Props) {
  const { setModal, settings, setSettings, dailyGoal, stop, pronounce, notify } = props
  const [goalDraft, setGoalDraft] = useState(() => String(dailyGoal))
  const [goalError, setGoalError] = useState('')

  return (
    <Modal title="设置" onClose={() => setModal(null)}>
      <div className="settings-form">
        <div className="goal-setting">
          <label htmlFor="daily-goal-input">
            今日小目标
            <span className="goal-input-wrap">
              <input
                id="daily-goal-input"
                className="goal-input"
                aria-label="今日目标词数"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={goalDraft}
                aria-invalid={!!goalError}
                aria-describedby={goalError ? 'daily-goal-error' : undefined}
                onChange={(e) => {
                  setGoalDraft(e.target.value)
                  setGoalError('')
                }}
              />
              <span aria-hidden="true">词</span>
            </span>
          </label>
          {goalError && (
            <p id="daily-goal-error" className="field-error" role="alert">
              {goalError}
            </p>
          )}
        </div>
        <label>
          发音来源
          <select
            value={settings.audioSource}
            onChange={(e) => {
              stop()
              setSettings({ ...settings, audioSource: e.target.value as Settings['audioSource'] })
            }}
          >
            <option value="local">本地音频</option>
            <option value="online">在线音频（有道）</option>
          </select>
        </label>
        <label>
          发音口音
          <select
            value={settings.accent}
            onChange={(e) =>
              setSettings({ ...settings, accent: e.target.value as Settings['accent'] })
            }
          >
            <option value="en-GB">英式英语</option>
            <option value="en-US">美式英语</option>
          </select>
        </label>
        <label>
          播放语速
          <select
            value={settings.rate}
            onChange={(e) => setSettings({ ...settings, rate: Number(e.target.value) })}
          >
            <option value={0.7}>0.7× · 慢慢听</option>
            <option value={0.8}>0.8× · 稍慢</option>
            <option value={1}>1.0× · 正常</option>
            <option value={1.2}>1.2× · 挑战一下</option>
          </select>
        </label>
        <label>
          每词重复次数
          <select
            value={settings.repeat}
            onChange={(e) => setSettings({ ...settings, repeat: Number(e.target.value) })}
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n} 次
              </option>
            ))}
          </select>
        </label>
        <label>
          切换行时自动发音
          <input
            type="checkbox"
            checked={settings.auto}
            onChange={(e) => setSettings({ ...settings, auto: e.target.checked })}
          />
        </label>
      </div>
      <div className="settings-bottom">
        <button
          className="outline-button"
          onClick={() => {
            stop()
            pronounce({ id: 'test', w: 'practice', m: '', p: '' }, -1)
          }}
        >
          <Icon name="volume" size={16} />
          测试发音
        </button>
        <button
          className="primary-button"
          onClick={() => {
            const goal = Number(goalDraft)
            if (!isValidDailyGoal(goal)) {
              setGoalError('请输入大于 0 的整数。')
              document.getElementById('daily-goal-input')?.focus()
              return
            }
            setSettings((current) => ({ ...current, dailyGoal: goal }))
            stop()
            setModal(null)
            notify('偏好已保存，下次打开会自动恢复。')
          }}
        >
          完成设置 <Icon name="check" size={17} />
        </button>
      </div>
    </Modal>
  )
}
