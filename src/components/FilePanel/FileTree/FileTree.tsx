import styles from './FileTree.module.css'
import TreeNode from './TreeNode'
import FileItem from './FileItem'
import { useStore } from '../../../store'
import { useT } from '../../../i18n'
import type { TreeNode as TreeNodeType, FileLeaf } from '../../../types'

function matchesQuery(node: TreeNodeType | FileLeaf, query: string): boolean {
  if (!query) return true
  if (node.kind === 'file') return node.name.toLowerCase().includes(query.toLowerCase())
  return node.children.some((child) => matchesQuery(child, query))
}

export default function FileTree() {
  const tree = useStore((s) => s.tree)
  const searchQuery = useStore((s) => s.searchQuery)
  const rootHandle = useStore((s) => s.rootHandle)
  const t = useT()

  if (tree.length === 0) {
    return (
      <div className={styles.empty}>
        {rootHandle ? t('emptyNoMd') : t('emptyNoDir')}
      </div>
    )
  }

  const visibleTree = searchQuery
    ? tree.filter((node) => matchesQuery(node, searchQuery))
    : tree

  if (searchQuery && visibleTree.length === 0) {
    return <div className={styles.empty}>{t('emptyNoMatch')}</div>
  }

  return (
    <div className={styles.tree}>
      {visibleTree.map((node) =>
        node.kind === 'directory' ? (
          <TreeNode key={node.kind + ':' + node.name} node={node} searchQuery={searchQuery} />
        ) : (
          <FileItem key={node.kind + ':' + node.name} file={node} />
        )
      )}
    </div>
  )
}
