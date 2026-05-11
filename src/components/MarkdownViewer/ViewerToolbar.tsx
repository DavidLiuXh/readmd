import styles from './MarkdownViewer.module.css'
import { useStore } from '../../store'
import { useThemeToggle } from '../../hooks/useTheme'

export default function ViewerToolbar() {
  const activeFile = useStore((s) => s.activeFile)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useThemeToggle()

  return (
    <div className={styles.toolbar}>
      <span className={styles.fileName}>
        {activeFile ? activeFile.name : 'MD Reader'}
      </span>
      <button
        className={styles.themeBtn}
        onClick={toggleTheme}
        title={theme === 'light' ? '切换暗色主题' : '切换亮色主题'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  )
}
