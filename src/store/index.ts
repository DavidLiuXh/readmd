// src/store/index.ts
import { create } from 'zustand'
import type { TreeNode, FileLeaf, RecentDir, TabId, Theme } from '../types'

interface FileSystemSlice {
  rootHandle: FileSystemDirectoryHandle | null
  tree: (TreeNode | FileLeaf)[]
  recentDirs: RecentDir[]
  setRootHandle: (handle: FileSystemDirectoryHandle) => void
  setTree: (tree: (TreeNode | FileLeaf)[]) => void
  setRecentDirs: (dirs: RecentDir[]) => void
  toggleNode: (node: TreeNode) => void
}

interface ViewerSlice {
  activeFile: FileLeaf | null
  content: string
  imageCache: Map<string, string>
  setActiveFile: (file: FileLeaf | null) => void
  setContent: (content: string) => void
  setImageCache: (cache: Map<string, string>) => void
}

interface UISlice {
  theme: Theme
  panelVisible: boolean
  panelWidth: number
  activeTab: TabId
  searchQuery: string
  setTheme: (theme: Theme) => void
  setPanelVisible: (visible: boolean) => void
  setPanelWidth: (width: number) => void
  setActiveTab: (tab: TabId) => void
  setSearchQuery: (query: string) => void
}

type StoreState = FileSystemSlice & ViewerSlice & UISlice

export const useStore = create<StoreState>((set) => ({
  rootHandle: null,
  tree: [],
  recentDirs: [],
  setRootHandle: (handle) => set({ rootHandle: handle }),
  setTree: (tree) => set({ tree }),
  setRecentDirs: (dirs) => set({ recentDirs: dirs }),
  toggleNode: (target) =>
    set((state) => ({
      tree: toggleNodeInTree(state.tree, target),
    })),

  activeFile: null,
  content: '',
  imageCache: new Map(),
  setActiveFile: (file) => set({ activeFile: file }),
  setContent: (content) => set({ content }),
  setImageCache: (cache) => set({ imageCache: cache }),

  theme: 'light',
  panelVisible: true,
  panelWidth: 240,
  activeTab: 'files',
  searchQuery: '',
  setTheme: (theme) => set({ theme }),
  setPanelVisible: (visible) => set({ panelVisible: visible }),
  setPanelWidth: (width) => set({ panelWidth: width }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))

function toggleNodeInTree(
  nodes: (TreeNode | FileLeaf)[],
  target: TreeNode
): (TreeNode | FileLeaf)[] {
  return nodes.map((node) => {
    if (node.kind === 'file') return node
    if (node === target) return { ...node, expanded: !node.expanded }
    return { ...node, children: toggleNodeInTree(node.children, target) }
  })
}
