import styles from './App.module.css'
import { useThemeInit } from './hooks/useTheme'

export default function App() {
  useThemeInit()
  return <div className={styles.app}>MD Reader</div>
}
