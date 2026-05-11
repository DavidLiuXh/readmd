// src/types.ts

export interface TreeNode {
  kind: 'directory'
  name: string
  handle: FileSystemDirectoryHandle
  children: (TreeNode | FileLeaf)[]
  expanded: boolean
}

export interface FileLeaf {
  kind: 'file'
  name: string
  handle: FileSystemFileHandle
  pathSegments: string[]
}

export interface RecentDir {
  name: string
  handle: FileSystemDirectoryHandle
}

export type TabId = 'files' | 'search' | 'recent'
export type Theme = 'light' | 'dark'
