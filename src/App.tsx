import { useEffect } from 'react'
import styles from './App.module.css'
import { useThemeInit } from './hooks/useTheme'
import { useLoadRecentDirs, useDirUrlMode, useFileUrlMode } from './hooks/useFileSystem'
import ActivityBar from './components/ActivityBar/ActivityBar'
import FilePanel from './components/FilePanel/FilePanel'
import MarkdownViewer from './components/MarkdownViewer/MarkdownViewer'

export default function App() {
  useThemeInit()
  const loadRecentDirs = useLoadRecentDirs()
  const loadDirUrl = useDirUrlMode()
  const loadFileUrl = useFileUrlMode()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const fileUrl = params.get('fileUrl')
    const dirUrl = params.get('dirUrl')
    if (fileUrl) {
      loadFileUrl(decodeURIComponent(fileUrl))
    } else if (dirUrl) {
      loadDirUrl(decodeURIComponent(dirUrl))
    } else {
      loadRecentDirs()
    }
  }, [loadRecentDirs, loadDirUrl, loadFileUrl])

  return (
    <div className={styles.app}>
      <ActivityBar />
      <FilePanel />
      <MarkdownViewer />
    </div>
  )
}
