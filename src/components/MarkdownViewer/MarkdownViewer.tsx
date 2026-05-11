import { useEffect, useRef, useState } from 'react'
import styles from './MarkdownViewer.module.css'
import ViewerToolbar from './ViewerToolbar'
import RenderedContent from './RenderedContent'
import { useStore } from '../../store'
import { useT } from '../../i18n'
import { renderMarkdown } from '../../lib/markdown'
import { resolveLocalImages } from '../../lib/imageResolver'
import type { FileLeaf } from '../../types'
import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'

// 单侧阅读面板的加载逻辑
function usePaneLoader(
  activeFile: FileLeaf | null,
  rootHandle: FileSystemDirectoryHandle | null,
  imageCache: Map<string, string>,
  setImageCache: (cache: Map<string, string>) => void
) {
  const imageCacheRef = useRef<Map<string, string>>(new Map())
  const [html, setHtml] = useState('')
  const [error, setError] = useState<string | null>(null)

  imageCacheRef.current = imageCache

  useEffect(() => {
    if (!activeFile) { setHtml(''); setError(null); return }

    imageCacheRef.current.forEach((url) => URL.revokeObjectURL(url))

    let cancelled = false

    async function load() {
      setError(null)
      try {
        let raw: string
        if (activeFile!.url) {
          raw = await fetch(activeFile!.url).then((r) => r.text())
        } else {
          const file = await activeFile!.handle!.getFile()
          raw = await file.text()
        }

        let markdown = raw
        let newCache = new Map<string, string>()

        if (rootHandle && !activeFile!.url) {
          const result = await resolveLocalImages(raw, rootHandle, activeFile!.pathSegments)
          markdown = result.markdown
          newCache = result.cache
        }

        if (cancelled) return

        const rendered = await renderMarkdown(markdown)
        setHtml(rendered)
        setImageCache(newCache)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '文件读取失败')
      }
    }

    load()
    return () => { cancelled = true }
  }, [activeFile, rootHandle])

  return { html, error }
}

export default function MarkdownViewer() {
  const activeFile = useStore((s) => s.activeFile)
  const activeFileRight = useStore((s) => s.activeFileRight)
  const rootHandle = useStore((s) => s.rootHandle)
  const imageCache = useStore((s) => s.imageCache)
  const imageCacheRight = useStore((s) => s.imageCacheRight)
  const setImageCache = useStore((s) => s.setImageCache)
  const setImageCacheRight = useStore((s) => s.setImageCacheRight)
  const splitMode = useStore((s) => s.splitMode)
  const activeSide = useStore((s) => s.activeSide)
  const setActiveSide = useStore((s) => s.setActiveSide)

  const left = usePaneLoader(activeFile, rootHandle, imageCache, setImageCache)
  const right = usePaneLoader(activeFileRight, rootHandle, imageCacheRight, setImageCacheRight)
  const t = useT()

  if (!splitMode) {
    return (
      <div className={styles.viewer}>
        <ViewerToolbar />
        {!activeFile ? (
          <div className={styles.empty} />
        ) : left.error ? (
          <div className={styles.errorCard}>⚠️ {left.error}</div>
        ) : (
          <RenderedContent html={left.html} />
        )}
      </div>
    )
  }

  return (
    <div className={styles.viewer}>
      <ViewerToolbar />
      <div className={styles.splitContainer}>
        {/* 左侧 */}
        <div
          className={`${styles.splitPane} ${activeSide === 'left' ? styles.activeSplitPane : ''}`}
          onClick={() => setActiveSide('left')}
        >
          <span className={`${styles.splitPaneLabel} ${activeSide === 'left' ? styles.splitPaneLabelActive : ''}`}>
            {t('splitLabelLeft')} {activeSide === 'left' ? '●' : ''}
          </span>
          {!activeFile ? (
            <div className={styles.empty}>{t('splitClickHint')}</div>
          ) : left.error ? (
            <div className={styles.errorCard}>⚠️ {left.error}</div>
          ) : (
            <RenderedContent html={left.html} />
          )}
        </div>
        {/* 右侧 */}
        <div
          className={`${styles.splitPane} ${activeSide === 'right' ? styles.activeSplitPane : ''}`}
          onClick={() => setActiveSide('right')}
        >
          <span className={`${styles.splitPaneLabel} ${activeSide === 'right' ? styles.splitPaneLabelActive : ''}`}>
            {t('splitLabelRight')} {activeSide === 'right' ? '●' : ''}
          </span>
          {!activeFileRight ? (
            <div className={styles.empty}>{t('splitClickHint')}</div>
          ) : right.error ? (
            <div className={styles.errorCard}>⚠️ {right.error}</div>
          ) : (
            <RenderedContent html={right.html} />
          )}
        </div>
      </div>
    </div>
  )
}
