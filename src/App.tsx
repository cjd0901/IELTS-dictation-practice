import { useDictationApp } from './hooks/useDictationApp.ts'
import { Sidebar } from './components/layout/Sidebar.tsx'
import { Header } from './components/layout/Header.tsx'
import { Icon } from './components/ui/Icon.tsx'
import { ChapterDialog } from './components/dialogs/ChapterDialog.tsx'
import { HelpDialog } from './components/dialogs/HelpDialog.tsx'
import { SettingsDialog } from './components/dialogs/SettingsDialog.tsx'
import { HistoryDetailDialog } from './components/dialogs/HistoryDetailDialog.tsx'
import { PracticePage } from './pages/PracticePage.tsx'
import { LibraryPage } from './pages/LibraryPage.tsx'
import { MistakesPage } from './pages/MistakesPage.tsx'
import { HistoryPage } from './pages/HistoryPage.tsx'
import './styles/workspace.css'
import './styles/theme.css'
import './styles/selects.css'
import './styles/layout.css'
import './styles/library.css'

export default function App() {
  const app = useDictationApp()
  const { view, modal, detail, toast } = app
  return (
    <div className={`app-shell ${view === 'practice' ? 'practice-screen' : ''}`}>
      <Sidebar {...app} />
      <div className="main-shell">
        <Header {...app} />
        <main className="app-content">
          {view === 'practice' && <PracticePage {...app} />}
          {view === 'library' && <LibraryPage {...app} />}
          {view === 'mistakes' && <MistakesPage {...app} />}
          {view === 'history' && <HistoryPage {...app} />}
          <footer className="page-footer">
            <span>仅供个人学习</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={17} />
          {toast}
        </div>
      )}
      {modal === 'chapters' && <ChapterDialog {...app} />}
      {modal === 'help' && <HelpDialog {...app} />}
      {modal === 'settings' && <SettingsDialog {...app} />}
      {detail && <HistoryDetailDialog {...app} />}
    </div>
  )
}
