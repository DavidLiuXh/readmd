import styles from './FileTree.module.css'
import { useStore } from '../../../store'
import type { FileLeaf } from '../../../types'

interface Props {
  file: FileLeaf
}

export default function FileItem({ file }: Props) {
  const activeFile = useStore((s) => s.activeFile)
  const setActiveFile = useStore((s) => s.setActiveFile)

  const isActive = activeFile?.handle === file.handle

  return (
    <div
      className={`${styles.fileRow} ${isActive ? styles.active : ''}`}
      onClick={() => setActiveFile(file)}
      title={file.name}
    >
      <span>📄</span>
      <span className={styles.fileName}>{file.name.replace(/\.md$/i, '')}</span>
    </div>
  )
}
