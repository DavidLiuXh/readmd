import styles from './FilePanel.module.css'
import { useStore } from '../../store'
import { useT } from '../../i18n'
import type { TabId } from '../../types'

export default function PanelHeader() {
  const activeTab = useStore((s) => s.activeTab)
  const setPanelVisible = useStore((s) => s.setPanelVisible)
  const t = useT()

  const PANEL_TITLE: Record<TabId, string> = {
    files: t('panelFiles'),
    search: t('panelSearch'),
    recent: t('panelRecent'),
  }

  return (
    <div className={styles.header}>
      <span>{PANEL_TITLE[activeTab]}</span>
      <button
        className={styles.collapseBtn}
        title={t('collapsePanel')}
        onClick={() => setPanelVisible(false)}
      >
        ‹
      </button>
    </div>
  )
}
