import { useEffect, useState } from 'react'
import { voicesForAccent } from '../../services/pronunciation.ts'
import type { Settings } from '../../types/study.ts'

type Props = {
  accent: Settings['accent']
  value: string
  onChange: (voiceURI: string) => void
}

export function LocalVoiceSelect({ accent, value, onChange }: Props) {
  const synthesis = 'speechSynthesis' in window ? window.speechSynthesis : undefined
  const [voices, setVoices] = useState(() => synthesis?.getVoices() ?? [])
  useEffect(() => {
    if (!synthesis) return
    const refresh = () => setVoices(synthesis.getVoices())
    synthesis.addEventListener('voiceschanged', refresh)
    window.addEventListener('focus', refresh)
    refresh()
    return () => {
      synthesis.removeEventListener('voiceschanged', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [synthesis])

  const available = voicesForAccent(voices, accent)
  const unavailable = !!value && !available.some((voice) => voice.voiceURI === value)
  return (
    <select
      className="local-voice-select"
      aria-label="本地音色"
      value={unavailable ? '' : value}
      disabled={!available.length}
      title={
        !available.length
          ? '暂无可用的英语音色，请检查系统语音设置或切换在线音频。'
          : '选择本地音色'
      }
      onFocus={() => synthesis && setVoices(synthesis.getVoices())}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">
        {!available.length
          ? '暂无英语音色'
          : unavailable
            ? '已存音色不可用 · 自动选择'
            : '自动选择音色'}
      </option>
      {available.map((voice) => (
        <option key={voice.voiceURI} value={voice.voiceURI}>
          {voice.name} · {voice.lang}
          {!voice.localService ? '（需联网）' : ''}
        </option>
      ))}
    </select>
  )
}
