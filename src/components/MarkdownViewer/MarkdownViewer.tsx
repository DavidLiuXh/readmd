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

// 编辑/查看源码面板状态
function useEditPane(activeFile: FileLeaf | null, rawMarkdown: string) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const isDirtyRef = useRef(false)
  const [isDirty, setIsDirty] = useState(false)

  // 文件切换：始终重置
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setOpen(false)
    isDirtyRef.current = false
    setIsDirty(false)
    setContent(rawMarkdown)
  }, [activeFile])

  // 同一文件刷新（rawMarkdown 更新）：未编辑时同步
  useEffect(() => {
    if (!isDirtyRef.current) {
      setContent(rawMarkdown)
    }
  }, [rawMarkdown])

  // 是否可写：有 handle 即可写回
  const canEdit = !!activeFile?.handle

  function handleChange(val: string) {
    setContent(val)
    const dirty = val !== rawMarkdown
    isDirtyRef.current = dirty
    setIsDirty(dirty)
  }

  function markClean() {
    isDirtyRef.current = false
    setIsDirty(false)
  }

  return { open, setOpen, content, handleChange, isDirty, canEdit, markClean }
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

  const leftContentRef = useRef<HTMLElement | null>(null)
  const rightContentRef = useRef<HTMLElement | null>(null)

  const leftPane = usePaneLoader(activeFile, rootHandle, imageCache, setImageCache, reloadKeyLeft)
  const rightPane = usePaneLoader(activeFileRight, rootHandle, imageCacheRight, setImageCacheRight, reloadKeyRight)

  const leftToc = useTocPane(activeFile, leftPane.rawHtml)
  const rightToc = useTocPane(activeFileRight, rightPane.rawHtml)

  const leftEdit = useEditPane(activeFile, leftPane.rawMarkdown)
  const rightEdit = useEditPane(activeFileRight, rightPane.rawMarkdown)

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

  const activeEdit = splitMode && activeSide === 'right' ? rightEdit : leftEdit
  const editOpen = activeEdit.open
  const canViewOrEdit = splitMode
    ? (activeSide === 'right' ? !!activeFileRight : !!activeFile)
    : !!activeFile

  function handleToggleEdit() {
    activeEdit.setOpen((o) => !o)
  }

  // 保存当前激活侧文件（仅 handle 模式可写）
  const handleSaveRef = useRef<() => void>(() => {})
  function handleSave() {
    const isRight = splitMode && activeSide === 'right'
    const edit = isRight ? rightEdit : leftEdit
    const file = isRight ? activeFileRight : activeFile
    const triggerReload = isRight
      ? () => setReloadKeyRight((k) => k + 1)
      : () => setReloadKeyLeft((k) => k + 1)

    if (!file?.handle || !edit.isDirty) return

    file.handle.createWritable()
      .then(async (writable) => {
        await writable.write(edit.content)
        await writable.close()
        edit.markClean()
        triggerReload()
      })
      .catch((e: unknown) => console.error('保存失败:', e))
  }
  handleSaveRef.current = handleSave

  // 全局键盘：Ctrl+S 保存 / Ctrl+A 选中内容区
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 's') {
        e.preventDefault()
        handleSaveRef.current()
        return
      }
      if (mod && e.key === 'a') {
        const active = document.activeElement
        const targets = [leftContentRef.current, rightContentRef.current].filter(Boolean) as HTMLElement[]
        const target = targets.find((el) => el.contains(active) || el === active)
        if (!target) return
        e.preventDefault()
        const sel = window.getSelection()
        if (!sel) return
        const range = document.createRange()
        range.selectNodeContents(target)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // ── 非分屏模式 ──────────────────────────────────────────────
  if (!splitMode) {
    return (
      <div className={styles.viewer}>
        <ViewerToolbar
          onReload={handleReload}
          canReload={canReload}
          tocOpen={leftToc.tocOpen}
          onToggleToc={() => leftToc.setTocOpen((o) => !o)}
          canToc={leftToc.canToc}
          editOpen={leftEdit.open}
          onToggleEdit={() => leftEdit.setOpen((o) => !o)}
          canViewOrEdit={!!activeFile}
          isEditable={leftEdit.canEdit}
          isDirty={leftEdit.isDirty}
          onSave={handleSave}
        />
        {!activeFile ? (
          <div className={styles.empty} />
        ) : leftPane.error ? (
          <div className={styles.errorCard}>⚠️ {leftPane.error}</div>
        ) : leftEdit.open ? (
          leftEdit.canEdit ? (
            <textarea
              ref={(el) => { leftContentRef.current = el }}
              className={styles.sourceEditor}
              value={leftEdit.content}
              onChange={(e) => leftEdit.handleChange(e.target.value)}
              spellCheck={false}
              tabIndex={-1}
            />
          ) : (
            <pre ref={(el) => { leftContentRef.current = el }} className={styles.sourceView} tabIndex={-1}>
              {leftPane.rawMarkdown}
            </pre>
          )
        ) : (
          <div ref={(el) => { leftContentRef.current = el }} className={styles.contentWrapper} style={{ paddingRight: leftToc.tocOpen ? 220 : 0 }} tabIndex={-1}>
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

  // ── 分屏模式 ────────────────────────────────────────────────
  return (
    <div className={styles.viewer}>
      <ViewerToolbar
        onReload={handleReload}
        canReload={canReload}
        tocOpen={tocOpen}
        onToggleToc={handleToggleToc}
        canToc={canToc}
        editOpen={editOpen}
        onToggleEdit={handleToggleEdit}
        canViewOrEdit={canViewOrEdit}
        isEditable={activeEdit.canEdit}
        isDirty={activeEdit.isDirty}
        onSave={handleSave}
        activeSide={activeSide}
        onSwitchSide={setActiveSide}
        currentFileName={
          activeSide === 'right'
            ? (activeFileRight?.name ?? '')
            : (activeFile?.name ?? '')
        }
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
          ) : leftEdit.open ? (
            leftEdit.canEdit ? (
              <textarea
                ref={(el) => { leftContentRef.current = el }}
                className={styles.sourceEditor}
                value={leftEdit.content}
                onChange={(e) => leftEdit.handleChange(e.target.value)}
                spellCheck={false}
                tabIndex={-1}
              />
            ) : (
              <pre ref={(el) => { leftContentRef.current = el }} className={styles.sourceView} tabIndex={-1}>
                {leftPane.rawMarkdown}
              </pre>
            )
          ) : (
            <div ref={(el) => { leftContentRef.current = el }} className={styles.contentWrapper} style={{ paddingRight: leftToc.tocOpen ? 220 : 0 }} tabIndex={-1}>
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
          ) : rightEdit.open ? (
            rightEdit.canEdit ? (
              <textarea
                ref={(el) => { rightContentRef.current = el }}
                className={styles.sourceEditor}
                value={rightEdit.content}
                onChange={(e) => rightEdit.handleChange(e.target.value)}
                spellCheck={false}
                tabIndex={-1}
              />
            ) : (
              <pre ref={(el) => { rightContentRef.current = el }} className={styles.sourceView} tabIndex={-1}>
                {rightPane.rawMarkdown}
              </pre>
            )
          ) : (
            <div ref={(el) => { rightContentRef.current = el }} className={styles.contentWrapper} style={{ paddingRight: rightToc.tocOpen ? 220 : 0 }} tabIndex={-1}>
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
