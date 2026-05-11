import styles from './FileTree/FileTree.module.css'
import { useOpenDirectory } from '../../hooks/useFileSystem'
import { useT } from '../../i18n'

export default function DirectoryPicker() {
  const openDirectory = useOpenDirectory()
  const t = useT()
  return (
    <button className={styles.pickerBtn} onClick={openDirectory}>
      {t('openDirectory')}
    </button>
  )
}
