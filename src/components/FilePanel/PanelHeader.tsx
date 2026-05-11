import styles from './FilePanel.module.css'
import { useStore } from '../../store'

const PANEL_TITLE: Record<string, string> = {
  files: '文件',
  search: '搜索',
  recent: '最近目录',
}

export default function PanelHeader() {
  const activeTab = useStore((s) => s.activeTab)
  const setPanelVisible = useStore((s) => s.setPanelVisible)

  return (
    <div className={styles.header}>
      <span>{PANEL_TITLE[activeTab] ?? '文件'}</span>
      <button
        className={styles.collapseBtn}
        title="收起面板"
        onClick={() => setPanelVisible(false)}
      >
        ‹
      </button>
    </div>
  )
}
