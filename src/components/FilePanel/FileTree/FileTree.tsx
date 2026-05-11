import styles from './FileTree.module.css'
import TreeNode from './TreeNode'
import FileItem from './FileItem'
import { useStore } from '../../../store'

export default function FileTree() {
  const tree = useStore((s) => s.tree)
  const searchQuery = useStore((s) => s.searchQuery)
  const rootHandle = useStore((s) => s.rootHandle)

  if (tree.length === 0) {
    return (
      <div className={styles.empty}>
        {rootHandle ? '当前目录下没有 .md 文件' : '打开一个目录以浏览 Markdown 文件'}
      </div>
    )
  }

  return (
    <div className={styles.tree}>
      {tree.map((node) =>
        node.kind === 'directory' ? (
          <TreeNode key={node.kind + ':' + node.name} node={node} searchQuery={searchQuery} />
        ) : (
          <FileItem key={node.kind + ':' + node.name} file={node} />
        )
      )}
    </div>
  )
}
