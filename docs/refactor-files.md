# 重构后的模块与验证文件

以下为重构阶段的文件清单，不包含后续新增功能。原始词库 `src/vocabulary.json` 保持原路径与字节内容不变。专用审计、回滚脚本及备份已按要求清理，现有回归测试保留。

- `src/App.tsx`
- `src/components/dialogs/ChapterDialog.tsx`
- `src/components/dialogs/HelpDialog.tsx`
- `src/components/dialogs/HistoryDetailDialog.tsx`
- `src/components/dialogs/SettingsDialog.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/practice/AudioToolbar.tsx`
- `src/components/practice/KeyboardGuide.tsx`
- `src/components/practice/WordRow.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/Icon.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/Wave.tsx`
- `src/data/navigation.ts`
- `src/data/vocabulary.ts`
- `src/hooks/useDictationApp.ts`
- `src/hooks/usePronunciation.ts`
- `src/hooks/useStudyStore.ts`
- `src/hooks/useToast.ts`
- `src/lib.ts`
- `src/main.tsx`
- `src/pages/HistoryPage.tsx`
- `src/pages/LibraryPage.tsx`
- `src/pages/MistakesPage.tsx`
- `src/pages/PracticePage.tsx`
- `src/services/exportHistory.ts`
- `src/services/pronunciation.ts`
- `src/services/sessionPersistence.ts`
- `src/services/storage.ts`
- `src/styles/README.md`
- `src/styles/global.css`
- `src/styles/layout.css`
- `src/styles/selects.css`
- `src/styles/theme.css`
- `src/styles/workspace.css`
- `src/types/study.ts`
- `src/utils/dom.ts`
- `src/utils/grading.ts`
- `src/utils/session.ts`
- `src/utils/settings.ts`
- `src/utils/shortcuts.ts`
- `src/utils/statistics.ts`
- `tests/baseline.test.mjs`
- `tests/export.test.mjs`
- `tests/fixtures/legacy-lib.txt`
- `tests/helpers/legacy.mjs`
- `tests/pronunciation.test.mjs`
- `tests/shortcuts.test.mjs`
- `tests/study.test.mjs`

重构阶段生成的详细变更记录及 SHA-256 校验清单已按要求清理，本页仅保留历史模块清单。
