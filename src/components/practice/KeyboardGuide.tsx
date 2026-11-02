import { Icon } from '../ui/Icon.tsx'
export function KeyboardGuide() {
  return (
    <aside className="practice-aside">
      <section className="shortcut-card">
        <div className="aside-card-heading">
          <Icon name="keyboard" size={18} />
          <h3>快捷键使用指南</h3>
        </div>
        <div className="shortcut-row">
          <span>播放 / 重播当前单词</span>
          <span className="key-combo">
            <kbd>Shift</kbd>
            <em>+</em>
            <kbd>Enter</kbd>
          </span>
        </div>
        <div className="shortcut-row">
          <span>输入短语中的空格</span>
          <kbd>Space</kbd>
        </div>
        <div className="shortcut-row">
          <span>跳到下一行</span>
          <kbd>
            Enter <b>↵</b>
          </kbd>
        </div>
        <div className="shortcut-row">
          <span>移到上一行</span>
          <kbd>↑</kbd>
        </div>
        <div className="shortcut-row">
          <span>移到下一行</span>
          <kbd>↓</kbd>
        </div>
        <div className="shortcut-row">
          <span>批改已输入的单词</span>
          <span className="key-combo">
            <kbd>Ctrl</kbd>
            <em>+</em>
            <kbd>Enter</kbd>
          </span>
        </div>
        <div className="shortcut-row">
          <span>Mac 上批改单词</span>
          <span className="key-combo">
            <kbd>⌘</kbd>
            <em>+</em>
            <kbd>Enter</kbd>
          </span>
        </div>
        <div className="shortcut-note">
          <Icon name="help" size={14} />
          <p>仅批改已输入的行；空白行可继续填写，再次按快捷键批改。</p>
        </div>
      </section>
    </aside>
  )
}
