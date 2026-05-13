import { useState } from 'react'
import styles from './FilePanel.module.css'
import { useStore } from '../../store'
import { useT } from '../../i18n'
import { useRefreshDirectory } from '../../hooks/useFileSystem'
import type { TabId } from '../../types'

export default function PanelHeader() {
  const activeTab = useStore((s) => s.activeTab)
  const rootHandle = useStore((s) => s.rootHandle)
  const setPanelVisible = useStore((s) => s.setPanelVisible)
  const refresh = useRefreshDirectory()
  const t = useT()
  const [refreshing, setRefreshing] = useState(false)

  const PANEL_TITLE: Record<TabId, string> = {
    files: t('panelFiles'),
    search: t('panelSearch'),
    recent: t('panelRecent'),
  }

  async function handleRefresh() {
    if (refreshing) return
    setRefreshing(true)
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className={styles.header}>
      <span>{PANEL_TITLE[activeTab]}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {rootHandle && (
          <button
            className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ''}`}
            title={t('refreshDir')}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.6 0 3 .68 4 1.76" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <polyline points="12,1 12,4.5 15.5,4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <button
          className={styles.collapseBtn}
          title={t('collapsePanel')}
          onClick={() => setPanelVisible(false)}
        >
          ‹
        </button>
      </div>
    </div>
  )
}
