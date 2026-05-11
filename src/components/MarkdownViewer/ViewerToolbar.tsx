import { useEffect } from 'react'
import styles from './MarkdownViewer.module.css'
import { useStore } from '../../store'
import { useThemeToggle } from '../../hooks/useTheme'

export default function ViewerToolbar() {
  const activeFile = useStore((s) => s.activeFile)
  const theme = useStore((s) => s.theme)
  const historyIndex = useStore((s) => s.historyIndex)
  const historyLength = useStore((s) => s.history.length)
  const navigateBack = useStore((s) => s.navigateBack)
  const navigateForward = useStore((s) => s.navigateForward)
  const toggleTheme = useThemeToggle()

  const canBack = historyIndex > 0
  const canForward = historyIndex < historyLength - 1

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); navigateBack() }
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); navigateForward() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigateBack, navigateForward])

  return (
    <div className={styles.toolbar}>
      <button
        className={styles.navBtn}
        onClick={navigateBack}
        disabled={!canBack}
        title="后退 (Alt+←)"
      >
        ←
      </button>
      <button
        className={styles.navBtn}
        onClick={navigateForward}
        disabled={!canForward}
        title="前进 (Alt+→)"
      >
        →
      </button>
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
