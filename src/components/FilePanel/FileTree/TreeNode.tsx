import styles from './FileTree.module.css'
import FileItem from './FileItem'
import { useStore } from '../../../store'
import type { TreeNode as TreeNodeType, FileLeaf } from '../../../types'

interface Props {
  node: TreeNodeType
  searchQuery: string
}

function matchesQuery(node: TreeNodeType | FileLeaf, query: string): boolean {
  if (!query) return true
  if (node.kind === 'file') return node.name.toLowerCase().includes(query.toLowerCase())
  return node.children.some((child) => matchesQuery(child, query))
}

export default function TreeNode({ node, searchQuery }: Props) {
  const toggleNode = useStore((s) => s.toggleNode)
  const forceExpand = searchQuery.length > 0

  const visibleChildren = node.children.filter((child) =>
    matchesQuery(child, searchQuery)
  )

  if (visibleChildren.length === 0) return null

  const isOpen = node.expanded || forceExpand

  return (
    <div>
      <div className={styles.dirRow} onClick={() => toggleNode(node)}>
        <span className={`${styles.arrow} ${isOpen ? styles.open : ''}`}>›</span>
        <span>📂</span>
        <span className={styles.dirName}>{node.name}</span>
      </div>
      {isOpen && (
        <div className={styles.children}>
          {visibleChildren.map((child) =>
            child.kind === 'directory' ? (
              <TreeNode key={child.name} node={child} searchQuery={searchQuery} />
            ) : (
              <FileItem key={child.name} file={child} />
            )
          )}
        </div>
      )}
    </div>
  )
}
