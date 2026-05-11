import { useStore } from '../../store'
import { useRestoreDirectory } from '../../hooks/useFileSystem'
import { deleteHandle } from '../../db'
import styles from './FileTree/FileTree.module.css'
import { useT } from '../../i18n'

export default function RecentDirList() {
  const recentDirs = useStore((s) => s.recentDirs)
  const setRecentDirs = useStore((s) => s.setRecentDirs)
  const restoreDirectory = useRestoreDirectory()
  const setActiveTab = useStore((s) => s.setActiveTab)
  const t = useT()

  async function handleClick(index: number) {
    const dir = recentDirs[index]
    const result = await restoreDirectory(dir)
    if (result === 'granted') setActiveTab('files')
  }

  async function handleDelete(e: React.MouseEvent, index: number) {
    e.stopPropagation()
    const dir = recentDirs[index]
    await deleteHandle(dir.name)
    setRecentDirs(recentDirs.filter((d) => d.name !== dir.name))
  }

  if (recentDirs.length === 0) {
    return <div className={styles.empty}>{t('noRecentDirs')}</div>
  }

  return (
    <div style={{ padding: '4px 0' }}>
      {recentDirs.map((dir, i) => (
        <div
          key={dir.name}
          className={styles.fileRow}
          style={{ justifyContent: 'space-between' }}
          onClick={() => handleClick(i)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
            <span>📁</span>
            <span className={styles.fileName}>{dir.name}</span>
          </span>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: 12,
              padding: '0 2px',
              flexShrink: 0,
            }}
            title={t('removeFromList')}
            onClick={(e) => handleDelete(e, i)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
