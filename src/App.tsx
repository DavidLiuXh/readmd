import styles from './App.module.css'
import { useThemeInit } from './hooks/useTheme'
import ActivityBar from './components/ActivityBar/ActivityBar'

export default function App() {
  useThemeInit()
  return (
    <div className={styles.app}>
      <ActivityBar />
      <div style={{ flex: 1 }}>内容区占位</div>
    </div>
  )
}
