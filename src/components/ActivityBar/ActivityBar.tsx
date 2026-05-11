import styles from './ActivityBar.module.css'
import { useStore } from '../../store'
import { useT } from '../../i18n'
import type { TabId } from '../../types'

export default function ActivityBar() {
  const activeTab = useStore((s) => s.activeTab)
  const panelVisible = useStore((s) => s.panelVisible)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const setPanelVisible = useStore((s) => s.setPanelVisible)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const t = useT()

  const TABS: { id: TabId; icon: string; title: string }[] = [
    { id: 'files', icon: '📁', title: t('tabFiles') },
    { id: 'search', icon: '🔍', title: t('tabSearch') },
    { id: 'recent', icon: '🕒', title: t('tabRecent') },
  ]

  function handleTabClick(id: TabId) {
    if (!panelVisible) setPanelVisible(true)
    setActiveTab(id)
    if (id !== 'search') setSearchQuery('')
  }

  return (
    <div className={styles.bar}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.iconBtn} ${activeTab === tab.id && panelVisible ? styles.active : ''}`}
          title={tab.title}
          onClick={() => handleTabClick(tab.id)}
        >
          {tab.icon}
        </button>
      ))}

      <div className={styles.spacer} />
      <div className={styles.divider} />

      <button className={styles.iconBtn} title={t('settings')}>
        ⚙️
      </button>

      {!panelVisible && (
        <button
          className={styles.expandBtn}
          title={t('expandPanel')}
          onClick={() => setPanelVisible(true)}
        >
          ▶
        </button>
      )}
    </div>
  )
}
