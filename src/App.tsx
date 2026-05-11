import { useEffect } from 'react'
import styles from './App.module.css'
import { useThemeInit } from './hooks/useTheme'
import { useLoadRecentDirs } from './hooks/useFileSystem'
import ActivityBar from './components/ActivityBar/ActivityBar'
import FilePanel from './components/FilePanel/FilePanel'
import MarkdownViewer from './components/MarkdownViewer/MarkdownViewer'

export default function App() {
  useThemeInit()
  const loadRecentDirs = useLoadRecentDirs()

  useEffect(() => {
    loadRecentDirs()
  }, [loadRecentDirs])

  return (
    <div className={styles.app}>
      <ActivityBar />
      <FilePanel />
      <MarkdownViewer />
    </div>
  )
}
