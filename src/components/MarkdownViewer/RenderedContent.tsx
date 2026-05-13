import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import styles from './MarkdownViewer.module.css'
import { useStore } from '../../store'
import type { FileLeaf } from '../../types'

interface Props {
  html: string
  onActiveTocId?: (id: string) => void
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

export default function RenderedContent({ html, onActiveTocId }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const rootHandle = useStore((s) => s.rootHandle)
  const activeFile = useStore((s) => s.activeFile)
  const navigateTo = useStore((s) => s.navigateTo)

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
        const container = block.closest('.code-block-wrapper') ?? block.closest('pre')
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

    // 拦截 .md 链接点击
    const links = ref.current.querySelectorAll<HTMLAnchorElement>('a[href]')
    const handleLinkClick = (e: MouseEvent) => {
      const a = e.currentTarget as HTMLAnchorElement
      const href = a.getAttribute('href') ?? ''
      if (/^https?:\/\/|^#|^mailto:/i.test(href)) return
      if (!href.endsWith('.md')) return
      e.preventDefault()
      if (!rootHandle || !activeFile) return
      resolveMarkdownLink(href, rootHandle, activeFile.pathSegments).then((leaf) => {
        if (leaf) navigateTo(leaf)
      })
    }
    links.forEach((a) => a.addEventListener('click', handleLinkClick))

    // IntersectionObserver：监听 toc 标题，高亮最靠前的可见标题
    let observer: IntersectionObserver | null = null
    if (onActiveTocId) {
      const headings = ref.current.querySelectorAll<HTMLElement>('[id^="toc-"]')
      const visible = new Set<string>()

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visible.add(entry.target.id)
            } else {
              visible.delete(entry.target.id)
            }
          })
          if (visible.size === 0) return
          // 取 id 序号最小的（最靠前的标题）
          const sorted = [...visible].sort((a, b) => {
            const na = parseInt(a.replace('toc-', ''), 10)
            const nb = parseInt(b.replace('toc-', ''), 10)
            return na - nb
          })
          onActiveTocId(sorted[0])
        },
        { threshold: 0, rootMargin: '-10% 0px -80% 0px' }
      )

      headings.forEach((h) => observer!.observe(h))
    }

    return () => {
      links.forEach((a) => a.removeEventListener('click', handleLinkClick))
      observer?.disconnect()
    }
  }, [html, rootHandle, activeFile, navigateTo, onActiveTocId])

  return (
    <div className={styles.content}>
      <div
        ref={ref}
        className={styles.contentInner}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
