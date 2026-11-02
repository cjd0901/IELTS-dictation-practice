import { Icon } from './Icon.tsx'
import type { IconName } from './Icon.tsx'

type Props = { icon: IconName; title: string; description: string; onStart: () => void }

export function EmptyState({ icon, title, description, onStart }: Props) {
  return (
    <div className="empty-state">
      <span>
        <Icon name={icon} size={38} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="primary-button" onClick={onStart}>
        开始听写 <Icon name="arrow" size={16} />
      </button>
    </div>
  )
}
