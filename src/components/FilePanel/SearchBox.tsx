import { useEffect, useRef } from 'react'
import styles from './FileTree/FileTree.module.css'
import { useStore } from '../../store'
import { useT } from '../../i18n'

export default function SearchBox() {
  const searchQuery = useStore((s) => s.searchQuery)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const inputRef = useRef<HTMLInputElement>(null)
  const t = useT()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <input
      ref={inputRef}
      className={styles.searchInput}
      type="text"
      placeholder={t('searchPlaceholder')}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  )
}
