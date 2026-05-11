import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import styles from './MarkdownViewer.module.css'
import { useStore } from '../../store'
import type { FileLeaf } from '../../types'

interface Props {
  html: string
}

let lastMermaidTheme: string | null = null

function ensureMermaid(theme: string) {
  const mermaidTheme = theme === 'dark' ? 'dark' : 'default'
  if (lastMermaidTheme !== mermaidTheme) {
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
    })
    lastMermaidTheme = mermaidTheme
  }
}

async function resolveMarkdownLink(
  href: string,
  rootHandle: FileSystemDirectoryHandle,
  currentPathSegments: string[]
): Promise<FileLeaf | null> {
  // 只处理相对路径的 .md 链接，跳过 http/https/# 等
  if (/^https?:\/\/|^#|^mailto:/i.test(href)) return null
  if (!href.endsWith('.md')) return null

  const fileDir = currentPathSegments.slice(0, -1)
  const parts = [...fileDir, ...href.split('/')]
  const normalized: string[] = []
  for (const part of parts) {
    if (part === '..') normalized.pop()
    else if (part && part !== '.') normalized.push(part)
  }
  if (normalized.length === 0) return null

  try {
    let current: FileSystemDirectoryHandle = rootHandle
    for (let i = 0; i < normalized.length - 1; i++) {
      current = await current.getDirectoryHandle(normalized[i])
    }
    const fileName = normalized[normalized.length - 1]
    const fileHandle = await current.getFileHandle(fileName)
    return {
      kind: 'file',
      name: fileName,
      handle: fileHandle,
      pathSegments: normalized,
    }
  } catch {
    return null
  }
}

export default function RenderedContent({ html }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const rootHandle = useStore((s) => s.rootHandle)
  const activeFile = useStore((s) => s.activeFile)
  const setActiveFile = useStore((s) => s.setActiveFile)

  useEffect(() => {
    if (!ref.current) return

    const themeAttr = document.documentElement.getAttribute('data-theme') ?? 'light'
    ensureMermaid(themeAttr)

    const mermaidBlocks = ref.current.querySelectorAll<HTMLElement>(
      'pre code.language-mermaid'
    )

    mermaidBlocks.forEach(async (block, i) => {
      const code = block.textContent ?? ''
      const id = `mermaid-${Date.now()}-${i}`
      try {
        const { svg } = await mermaid.render(id, code)
        const container = block.closest('pre')
        if (container) {
          const wrapper = document.createElement('div')
          wrapper.className = 'mermaid-output'
          wrapper.innerHTML = svg
          container.replaceWith(wrapper)
        }
      } catch {
        // 语法错误时保留原始代码块
      }
    })

    // 拦截 .md 链接点击，在扩展内打开
    const links = ref.current.querySelectorAll<HTMLAnchorElement>('a[href]')
    const handleLinkClick = (e: MouseEvent) => {
      const a = e.currentTarget as HTMLAnchorElement
      const href = a.getAttribute('href') ?? ''
      if (/^https?:\/\/|^#|^mailto:/i.test(href)) return // 外部链接放行
      if (!href.endsWith('.md')) return // 非 md 链接放行
      e.preventDefault()
      if (!rootHandle || !activeFile) return
      resolveMarkdownLink(href, rootHandle, activeFile.pathSegments).then((leaf) => {
        if (leaf) setActiveFile(leaf)
      })
    }
    links.forEach((a) => a.addEventListener('click', handleLinkClick))
    return () => links.forEach((a) => a.removeEventListener('click', handleLinkClick))
  }, [html, rootHandle, activeFile, setActiveFile])

  return (
    <div
      ref={ref}
      className={styles.content}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
