// src/store/index.ts
import { create } from 'zustand'
import type { TreeNode, FileLeaf, RecentDir, TabId, Theme } from '../types'
import type { Locale } from '../i18n/locales'

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
  history: FileLeaf[]
  historyIndex: number
  // 分屏
  splitMode: boolean
  activeSide: 'left' | 'right'
  activeFileRight: FileLeaf | null
  imageCacheRight: Map<string, string>
  setActiveFile: (file: FileLeaf | null) => void
  navigateTo: (file: FileLeaf) => void
  navigateBack: () => void
  navigateForward: () => void
  setContent: (content: string) => void
  setImageCache: (cache: Map<string, string>) => void
  setSplitMode: (on: boolean) => void
  setActiveSide: (side: 'left' | 'right') => void
  setActiveFileRight: (file: FileLeaf | null) => void
  setImageCacheRight: (cache: Map<string, string>) => void
}

interface UISlice {
  theme: Theme
  locale: Locale
  panelVisible: boolean
  panelWidth: number
  activeTab: TabId
  searchQuery: string
  setTheme: (theme: Theme) => void
  setLocale: (locale: Locale) => void
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
  history: [],
  historyIndex: -1,
  splitMode: false,
  activeSide: 'left',
  activeFileRight: null,
  imageCacheRight: new Map(),
  setActiveFile: (file) => set({ activeFile: file }),
  navigateTo: (file) =>
    set((state) => {
      // 分屏模式下根据 activeSide 决定填入哪侧
      if (state.splitMode && state.activeSide === 'right') {
        return { activeFileRight: file }
      }
      const newHistory = [...state.history.slice(0, state.historyIndex + 1), file]
      return { activeFile: file, history: newHistory, historyIndex: newHistory.length - 1 }
    }),
  navigateBack: () =>
    set((state) => {
      if (state.historyIndex <= 0) return {}
      const index = state.historyIndex - 1
      return { activeFile: state.history[index], historyIndex: index }
    }),
  navigateForward: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return {}
      const index = state.historyIndex + 1
      return { activeFile: state.history[index], historyIndex: index }
    }),
  setContent: (content) => set({ content }),
  setImageCache: (cache) => set({ imageCache: cache }),
  setSplitMode: (on) => set({ splitMode: on, activeSide: 'left', activeFileRight: null }),
  setActiveSide: (side) => set({ activeSide: side }),
  setActiveFileRight: (file) => set({ activeFileRight: file }),
  setImageCacheRight: (cache) => set({ imageCacheRight: cache }),

  theme: 'light',
  locale: 'zh',
  panelVisible: true,
  panelWidth: 240,
  activeTab: 'files',
  searchQuery: '',
  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
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
