import styles from './FileTree/FileTree.module.css'
import { useStore } from '../../store'

export default function SearchBox() {
  const searchQuery = useStore((s) => s.searchQuery)
  const setSearchQuery = useStore((s) => s.setSearchQuery)

  return (
    <input
      className={styles.searchInput}
      type="text"
      placeholder="按文件名过滤..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  )
}
