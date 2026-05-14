import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './MarkdownViewer.module.css'
import ViewerToolbar from './ViewerToolbar'
import RenderedContent from './RenderedContent'
import TocPanel from './TocPanel/TocPanel'
import { useStore } from '../../store'
import { useT } from '../../i18n'
import { renderMarkdown } from '../../lib/markdown'
import { resolveLocalImages } from '../../lib/imageResolver'
import { extractToc } from '../../lib/toc'
import type { TocItem } from '../../lib/toc'
import type { FileLeaf } from '../../types'
import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'

function usePaneLoader(
  activeFile: FileLeaf | null,
  rootHandle: FileSystemDirectoryHandle | null,
  imageCache: Map<string, string>,
  setImageCache: (cache: Map<string, string>) => void,
  reloadKey: number
) {
  const imageCacheRef = useRef<Map<string, string>>(new Map())
  const [rawHtml, setRawHtml] = useState('')
  const [rawMarkdown, setRawMarkdown] = useState('')
  const [error, setError] = useState<string | null>(null)

  imageCacheRef.current = imageCache

  useEffect(() => {
    if (!activeFile) { setRawHtml(''); setRawMarkdown(''); setError(null); return }

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
        setRawHtml(rendered)
        setRawMarkdown(raw)
        setImageCache(newCache)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '文件读取失败')
      }
    }

    load()
    return () => { cancelled = true }
  }, [activeFile, rootHandle, reloadKey])

  return { rawHtml, rawMarkdown, error }
}

function useTocPane(activeFile: FileLeaf | null, rawHtml: string) {
  const [tocOpen, setTocOpen] = useState(false)
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    setTocOpen(false)
    setActiveId('')
  }, [activeFile])

  const { html, items } = useMemo(() => {
    if (!rawHtml) return { html: '', items: [] as TocItem[] }
    return extractToc(rawHtml)
  }, [rawHtml])

  const canToc = items.length > 0

  return { tocOpen, setTocOpen, activeId, setActiveId, html, items, canToc }
}

function handleSelectAll(e: React.KeyboardEvent<HTMLElement>) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    e.preventDefault()
    const sel = window.getSelection()
    if (!sel) return
    const range = document.createRange()
    range.selectNodeContents(e.currentTarget)
    sel.removeAllRanges()
    sel.addRange(range)
  }
}

function useSourcePane(activeFile: FileLeaf | null) {
  const [sourceOpen, setSourceOpen] = useState(false)

  useEffect(() => {
    setSourceOpen(false)
  }, [activeFile])

  return { sourceOpen, setSourceOpen }
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

  const [reloadKeyLeft, setReloadKeyLeft] = useState(0)
  const [reloadKeyRight, setReloadKeyRight] = useState(0)

  const leftPane = usePaneLoader(activeFile, rootHandle, imageCache, setImageCache, reloadKeyLeft)
  const rightPane = usePaneLoader(activeFileRight, rootHandle, imageCacheRight, setImageCacheRight, reloadKeyRight)

  const leftToc = useTocPane(activeFile, leftPane.rawHtml)
  const rightToc = useTocPane(activeFileRight, rightPane.rawHtml)

  const leftSource = useSourcePane(activeFile)
  const rightSource = useSourcePane(activeFileRight)

  const t = useT()

  function handleReload() {
    if (splitMode && activeSide === 'right') {
      setReloadKeyRight((k) => k + 1)
    } else {
      setReloadKeyLeft((k) => k + 1)
    }
  }

  const canReload = splitMode
    ? (activeSide === 'right' ? !!activeFileRight : !!activeFile)
    : !!activeFile

  const activeToc = splitMode && activeSide === 'right' ? rightToc : leftToc
  const tocOpen = activeToc.tocOpen
  const canToc = activeToc.canToc

  function handleToggleToc() {
    activeToc.setTocOpen((o) => !o)
  }

  const activeSource = splitMode && activeSide === 'right' ? rightSource : leftSource
  const sourceOpen = activeSource.sourceOpen
  const canSource = splitMode
    ? (activeSide === 'right' ? !!activeFileRight : !!activeFile)
    : !!activeFile

  function handleToggleSource() {
    activeSource.setSourceOpen((o) => !o)
  }

  if (!splitMode) {
    return (
      <div className={styles.viewer}>
        <ViewerToolbar
          onReload={handleReload}
          canReload={canReload}
          tocOpen={leftToc.tocOpen}
          onToggleToc={() => leftToc.setTocOpen((o) => !o)}
          canToc={leftToc.canToc}
          sourceOpen={leftSource.sourceOpen}
          onToggleSource={() => leftSource.setSourceOpen((o) => !o)}
          canSource={!!activeFile}
        />
        {!activeFile ? (
          <div className={styles.empty} />
        ) : leftPane.error ? (
          <div className={styles.errorCard}>⚠️ {leftPane.error}</div>
        ) : leftSource.sourceOpen ? (
          <pre className={styles.sourceView}>{leftPane.rawMarkdown}</pre>
        ) : (
          <div className={styles.contentWrapper} style={{ paddingRight: leftToc.tocOpen ? 220 : 0 }} tabIndex={0} onKeyDown={handleSelectAll}>
            <RenderedContent
              html={leftToc.html}
              onActiveTocId={leftToc.setActiveId}
            />
            {leftToc.tocOpen && (
              <TocPanel
                items={leftToc.items}
                activeId={leftToc.activeId}
                onClose={() => leftToc.setTocOpen(false)}
              />
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.viewer}>
      <ViewerToolbar
        onReload={handleReload}
        canReload={canReload}
        tocOpen={tocOpen}
        onToggleToc={handleToggleToc}
        canToc={canToc}
        sourceOpen={sourceOpen}
        onToggleSource={handleToggleSource}
        canSource={canSource}
      />
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
          ) : leftPane.error ? (
            <div className={styles.errorCard}>⚠️ {leftPane.error}</div>
          ) : leftSource.sourceOpen ? (
            <pre className={styles.sourceView} tabIndex={0} onKeyDown={handleSelectAll}>{leftPane.rawMarkdown}</pre>
          ) : (
            <div className={styles.contentWrapper} style={{ paddingRight: leftToc.tocOpen ? 220 : 0 }} tabIndex={0} onKeyDown={handleSelectAll}>
              <RenderedContent
                html={leftToc.html}
                onActiveTocId={leftToc.setActiveId}
              />
              {leftToc.tocOpen && (
                <TocPanel
                  items={leftToc.items}
                  activeId={leftToc.activeId}
                  onClose={() => leftToc.setTocOpen(false)}
                />
              )}
            </div>
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
          ) : rightPane.error ? (
            <div className={styles.errorCard}>⚠️ {rightPane.error}</div>
          ) : rightSource.sourceOpen ? (
            <pre className={styles.sourceView}>{rightPane.rawMarkdown}</pre>
          ) : (
            <div className={styles.contentWrapper} style={{ paddingRight: rightToc.tocOpen ? 220 : 0 }} tabIndex={0} onKeyDown={handleSelectAll}>
              <RenderedContent
                html={rightToc.html}
                onActiveTocId={rightToc.setActiveId}
              />
              {rightToc.tocOpen && (
                <TocPanel
                  items={rightToc.items}
                  activeId={rightToc.activeId}
                  onClose={() => rightToc.setTocOpen(false)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
