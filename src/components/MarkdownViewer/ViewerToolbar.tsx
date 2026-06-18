import { useEffect } from 'react'
import styles from './MarkdownViewer.module.css'
import { useStore } from '../../store'
import { useThemeToggle, useLocaleToggle } from '../../hooks/useTheme'
import { useT } from '../../i18n'

interface Props {
  onReload: () => void
  canReload: boolean
  tocOpen: boolean
  onToggleToc: () => void
  canToc: boolean
  editOpen: boolean
  onToggleEdit: () => void
  canViewOrEdit: boolean
  isEditable: boolean       // 是否可写（有 handle）
  isDirty: boolean          // 是否有未保存修改
  onSave: () => void
  activeSide?: 'left' | 'right'
  onSwitchSide?: (side: 'left' | 'right') => void
  currentFileName?: string
}

export default function ViewerToolbar({
  onReload, canReload,
  tocOpen, onToggleToc, canToc,
  editOpen, onToggleEdit, canViewOrEdit,
  isEditable, isDirty, onSave,
  activeSide, onSwitchSide,
  currentFileName,
}: Props) {
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
      <button
        className={styles.navBtn}
        onClick={onReload}
        disabled={!canReload}
        title={t('refreshFile')}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.6 0 3 .68 4 1.76" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <polyline points="12,1 12,4.5 15.5,4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button
        className={`${styles.navBtn} ${tocOpen ? styles.navBtnActive : ''}`}
        onClick={onToggleToc}
        disabled={!canToc}
        title={t('toc')}
        style={{ fontSize: 15, fontWeight: 400 }}
      >
        ≡
      </button>
      {/* 编辑源码 / 查看源码 切换按钮 */}
      <button
        className={`${styles.navBtn} ${editOpen ? styles.navBtnActive : ''}`}
        onClick={onToggleEdit}
        disabled={!canViewOrEdit}
        title={isEditable ? t('editSource') : t('sourceView')}
        style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0 }}
      >
        {'</>'}
      </button>
      {/* 保存按钮：仅编辑模式下可写文件显示 */}
      {editOpen && isEditable && (
        <button
          className={`${styles.navBtn} ${isDirty ? styles.navBtnDirty : ''}`}
          onClick={onSave}
          disabled={!isDirty}
          title={t('saveFile')}
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          {t('saveFile')}{isDirty ? ' ●' : ''}
        </button>
      )}
      {activeSide !== undefined && onSwitchSide && (
        <span className={styles.sideSwitcher}>
          <button
            className={`${styles.sideBtn} ${activeSide === 'left' ? styles.sideBtnActive : ''}`}
            onClick={() => onSwitchSide('left')}
            title={t('splitLabelLeft')}
          >
            {t('splitLabelLeft')}
          </button>
          <button
            className={`${styles.sideBtn} ${activeSide === 'right' ? styles.sideBtnActive : ''}`}
            onClick={() => onSwitchSide('right')}
            title={t('splitLabelRight')}
          >
            {t('splitLabelRight')}
          </button>
        </span>
      )}
      <span className={styles.fileName}>
        {currentFileName ?? (activeFile ? activeFile.name : 'ReadMD')}
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
