import { useEffect, useRef } from 'react'
import styles from './FileTree/FileTree.module.css'
import { useStore } from '../../store'

export default function SearchBox() {
  const searchQuery = useStore((s) => s.searchQuery)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <input
      ref={inputRef}
      className={styles.searchInput}
      type="text"
      placeholder="按文件名过滤..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  )
}
