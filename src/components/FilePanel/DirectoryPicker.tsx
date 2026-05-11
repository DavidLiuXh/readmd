import styles from './FileTree/FileTree.module.css'
import { useOpenDirectory } from '../../hooks/useFileSystem'

export default function DirectoryPicker() {
  const openDirectory = useOpenDirectory()
  return (
    <button className={styles.pickerBtn} onClick={openDirectory}>
      📂 打开目录
    </button>
  )
}
