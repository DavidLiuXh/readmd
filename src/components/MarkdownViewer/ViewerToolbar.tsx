import { useEffect } from 'react'
import styles from './MarkdownViewer.module.css'
import { useStore } from '../../store'
import { useThemeToggle, useLocaleToggle } from '../../hooks/useTheme'
import { useT } from '../../i18n'

export default function ViewerToolbar() {
  const activeFile = useStore((s) => s.activeFile)
  const theme = useStore((s) => s.theme)
  const locale = useStore((s) => s.locale)
  const historyIndex = useStore((s) => s.historyIndex)
  const historyLength = useStore((s) => s.history.length)
  const navigateBack = useStore((s) => s.navigateBack)
  const navigateForward = useStore((s) => s.navigateForward)
  const splitMode = useStore((s) => s.splitMode)
  const setSplitMode = useStore((s) => s.setSplitMode)
  const toggleTheme = useThemeToggle()
  const toggleLocale = useLocaleToggle()
  const t = useT()

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
        title={t('navigateBack')}
      >
        ←
      </button>
      <button
        className={styles.navBtn}
        onClick={navigateForward}
        disabled={!canForward}
        title={t('navigateForward')}
      >
        →
      </button>
      <span className={styles.fileName}>
        {activeFile ? activeFile.name : 'MD Reader'}
      </span>
      <button
        className={`${styles.themeBtn} ${splitMode ? styles.themeBtnActive : ''}`}
        onClick={() => setSplitMode(!splitMode)}
        title={splitMode ? t('splitClose') : t('splitOpen')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="2" width="6" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
          <rect x="9" y="2" width="6" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
        </svg>
      </button>
      <button
        className={styles.themeBtn}
        onClick={toggleTheme}
        title={theme === 'light' ? t('themeDark') : t('themeLight')}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      <button
        className={styles.themeBtn}
        onClick={toggleLocale}
        title={locale === 'zh' ? 'Switch to English' : '切换为中文'}
        style={{ fontSize: 12, fontWeight: 600, padding: '4px 6px' }}
      >
        {locale === 'zh' ? 'EN' : '中'}
      </button>
    </div>
  )
}
