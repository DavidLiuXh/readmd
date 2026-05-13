import { useCallback } from 'react'
import { useStore } from '../store'
import { saveHandle, loadAllHandles } from '../db'
import type { TreeNode, FileLeaf, RecentDir } from '../types'

async function buildTree(
  dirHandle: FileSystemDirectoryHandle,
  pathSegments: string[] = []
): Promise<(TreeNode | FileLeaf)[]> {
  const nodes: (TreeNode | FileLeaf)[] = []

  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'file' && name.endsWith('.md')) {
      nodes.push({
        kind: 'file',
        name,
        handle: handle as FileSystemFileHandle,
        pathSegments: [...pathSegments, name],
      })
    } else if (handle.kind === 'directory') {
      const children = await buildTree(
        handle as FileSystemDirectoryHandle,
        [...pathSegments, name]
      )
      if (children.length > 0) {
        nodes.push({
          kind: 'directory',
          name,
          handle: handle as FileSystemDirectoryHandle,
          children,
          expanded: false,
        })
      }
    }
  }

  return nodes.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export function useOpenDirectory() {
  const setRootHandle = useStore((s) => s.setRootHandle)
  const setTree = useStore((s) => s.setTree)
  const setRecentDirs = useStore((s) => s.setRecentDirs)
  const recentDirs = useStore((s) => s.recentDirs)
  const setImageCache = useStore((s) => s.setImageCache)

  return useCallback(async () => {
    let handle: FileSystemDirectoryHandle
    try {
      handle = await window.showDirectoryPicker({ mode: 'read' })
    } catch (err) {
      // AbortError：用户取消；NotAllowedError：系统保护目录，浏览器已有原生提示
      if (err instanceof DOMException &&
          (err.name === 'AbortError' || err.name === 'NotAllowedError')) return
      throw err
    }

    const tree = await buildTree(handle)
    setRootHandle(handle)
    setTree(tree)
    setImageCache(new Map())
    await saveHandle(handle)

    const updated: RecentDir[] = [
      { name: handle.name, handle },
      ...recentDirs.filter((d) => d.name !== handle.name),
    ].slice(0, 10)
    setRecentDirs(updated)
  }, [setRootHandle, setTree, setRecentDirs, recentDirs, setImageCache])
}

export function useLoadRecentDirs() {
  const setRecentDirs = useStore((s) => s.setRecentDirs)

  return useCallback(async () => {
    const records = await loadAllHandles()
    const dirs: RecentDir[] = records.map((r) => ({
      name: r.name,
      handle: r.handle,
    }))
    setRecentDirs(dirs)
  }, [setRecentDirs])
}

export function useRestoreDirectory() {
  const setRootHandle = useStore((s) => s.setRootHandle)
  const setTree = useStore((s) => s.setTree)
  const setImageCache = useStore((s) => s.setImageCache)

  return useCallback(
    async (dir: RecentDir): Promise<'granted' | 'prompt' | 'denied'> => {
      const status = await dir.handle.queryPermission({ mode: 'read' })
      if (status === 'granted') {
        const tree = await buildTree(dir.handle)
        setRootHandle(dir.handle)
        setTree(tree)
        setImageCache(new Map())
        return 'granted'
      }
      if (status === 'prompt') {
        const result = await dir.handle.requestPermission({ mode: 'read' })
        if (result === 'granted') {
          const tree = await buildTree(dir.handle)
          setRootHandle(dir.handle)
          setTree(tree)
          setImageCache(new Map())
        }
        return result as 'granted' | 'prompt' | 'denied'
      }
      return 'denied'
    },
    [setRootHandle, setTree, setImageCache]
  )
}

// 直接打开单个 md 文件（fileUrl 参数模式）
export function useFileUrlMode() {
  const setTree = useStore((s) => s.setTree)
  const setImageCache = useStore((s) => s.setImageCache)
  const navigateTo = useStore((s) => s.navigateTo)

  return useCallback((fileUrl: string) => {
    const name = decodeURIComponent(fileUrl.split('/').pop() ?? 'file.md')
    const leaf: FileLeaf = { kind: 'file', name, url: fileUrl, pathSegments: [name] }
    setTree([leaf])
    setImageCache(new Map())
    navigateTo(leaf)
  }, [setTree, setImageCache, navigateTo])
}

// 解析 dirUrl 参数，通过 fetch 获取目录页 HTML，构建虚拟文件树（无需 FileSystemHandle）
export function useDirUrlMode() {
  const setTree = useStore((s) => s.setTree)
  const setImageCache = useStore((s) => s.setImageCache)

  return useCallback(async (dirUrl: string) => {
    const html = await fetch(dirUrl).then((r) => r.text())
    const regex = /addRow\("(.*?)",\s*"(.*?)",\s*(\d+),\s*(\d+),\s*"([\d.]+ [BkMG]B?)",\s*(\d+),\s*"(.*?)"\);/g
    const mdExts = ['.md', '.mkd', '.markdown', '.mdx']
    const nodes: FileLeaf[] = []

    let m
    while ((m = regex.exec(html)) !== null) {
      const name = m[1]
      const path = m[2]
      const isFolder = !!parseInt(m[3])
      if (!isFolder && mdExts.some((ext) => name.toLowerCase().endsWith(ext))) {
        nodes.push({
          kind: 'file',
          name,
          url: dirUrl + path,
          pathSegments: [name],
        })
      }
    }

    nodes.sort((a, b) => a.name.localeCompare(b.name))
    setTree(nodes)
    setImageCache(new Map())
  }, [setTree, setImageCache])
}

export function useRefreshDirectory() {
  const rootHandle = useStore((s) => s.rootHandle)
  const setTree = useStore((s) => s.setTree)

  return useCallback(async () => {
    if (!rootHandle) return
    const tree = await buildTree(rootHandle)
    setTree(tree)
  }, [rootHandle, setTree])
}
