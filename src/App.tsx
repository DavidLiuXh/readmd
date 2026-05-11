import { useEffect } from 'react'
import styles from './App.module.css'
import { useThemeInit } from './hooks/useTheme'
import { useLoadRecentDirs, useDirUrlMode } from './hooks/useFileSystem'
import ActivityBar from './components/ActivityBar/ActivityBar'
import FilePanel from './components/FilePanel/FilePanel'
import MarkdownViewer from './components/MarkdownViewer/MarkdownViewer'

export default function App() {
  useThemeInit()
  const loadRecentDirs = useLoadRecentDirs()
  const loadDirUrl = useDirUrlMode()

  useEffect(() => {
    // 检测 dirUrl 参数（从本地目录页跳转过来）
    const params = new URLSearchParams(location.search)
    const dirUrl = params.get('dirUrl')
    if (dirUrl) {
      loadDirUrl(decodeURIComponent(dirUrl))
    } else {
      loadRecentDirs()
    }
  }, [loadRecentDirs, loadDirUrl])

  return (
    <div className={styles.app}>
      <ActivityBar />
      <FilePanel />
      <MarkdownViewer />
    </div>
  )
}
