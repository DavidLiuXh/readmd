import { useEffect, useRef, useState } from 'react'
import styles from './MarkdownViewer.module.css'
import ViewerToolbar from './ViewerToolbar'
import RenderedContent from './RenderedContent'
import { useStore } from '../../store'
import { renderMarkdown } from '../../lib/markdown'
import { resolveLocalImages } from '../../lib/imageResolver'
import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'

export default function MarkdownViewer() {
  const activeFile = useStore((s) => s.activeFile)
  const rootHandle = useStore((s) => s.rootHandle)
  const imageCache = useStore((s) => s.imageCache)
  const setImageCache = useStore((s) => s.setImageCache)
  const imageCacheRef = useRef<Map<string, string>>(new Map())
  const [html, setHtml] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 同步更新 ref，确保 useEffect 内始终访问最新的 imageCache
  imageCacheRef.current = imageCache

  useEffect(() => {
    if (!activeFile) return

    // 切换文件时 revoke 旧 blob URLs
    imageCacheRef.current.forEach((url) => URL.revokeObjectURL(url))

    let cancelled = false

    async function load() {
      setError(null)
      try {
        const file = await activeFile!.handle.getFile()
        const raw = await file.text()

        let markdown = raw
        let newCache = new Map<string, string>()

        if (rootHandle) {
          const result = await resolveLocalImages(raw, rootHandle, activeFile!.pathSegments)
          markdown = result.markdown
          newCache = result.cache
        }

        if (cancelled) return

        const rendered = await renderMarkdown(markdown)
        setHtml(rendered)
        setImageCache(newCache)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '文件读取失败')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [activeFile, rootHandle])

  if (!activeFile) {
    return (
      <div className={styles.viewer}>
        <ViewerToolbar />
        <div className={styles.empty}>选择左侧文件开始阅读</div>
      </div>
    )
  }

  return (
    <div className={styles.viewer}>
      <ViewerToolbar />
      {error ? (
        <div className={styles.errorCard}>⚠️ {error}</div>
      ) : (
        <RenderedContent html={html} />
      )}
    </div>
  )
}
