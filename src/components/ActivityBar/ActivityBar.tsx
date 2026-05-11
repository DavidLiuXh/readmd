import styles from './ActivityBar.module.css'
import { useStore } from '../../store'
import type { TabId } from '../../types'

const TABS: { id: TabId; icon: string; title: string }[] = [
  { id: 'files', icon: '📁', title: '文件树' },
  { id: 'search', icon: '🔍', title: '搜索' },
  { id: 'recent', icon: '🕒', title: '最近目录' },
]

export default function ActivityBar() {
  const activeTab = useStore((s) => s.activeTab)
  const panelVisible = useStore((s) => s.panelVisible)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const setPanelVisible = useStore((s) => s.setPanelVisible)
  const setSearchQuery = useStore((s) => s.setSearchQuery)

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

      <button
        className={styles.iconBtn}
        title="设置"
      >
        ⚙️
      </button>

      {!panelVisible && (
        <button
          className={styles.expandBtn}
          title="展开面板"
          onClick={() => setPanelVisible(true)}
        >
          ▶
        </button>
      )}
    </div>
  )
}
