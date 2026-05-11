import { useRef, useCallback, useEffect } from 'react'
import styles from './FilePanel.module.css'
import PanelHeader from './PanelHeader'
import { useStore } from '../../store'

const MIN_WIDTH = 160
const MAX_WIDTH = 400
const STORAGE_KEY = 'md-reader-panel-width'

export default function FilePanel() {
  const panelVisible = useStore((s) => s.panelVisible)
  const panelWidth = useStore((s) => s.panelWidth)
  const setPanelWidth = useStore((s) => s.setPanelWidth)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)
  const latestWidth = useRef(panelWidth)

  // 同步最新宽度到 ref，供 onMouseUp 使用
  useEffect(() => {
    latestWidth.current = panelWidth
  }, [panelWidth])

  // 从 chrome.storage 恢复宽度
  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const saved = result[STORAGE_KEY] as number | undefined
      if (saved && saved >= MIN_WIDTH && saved <= MAX_WIDTH) {
        setPanelWidth(saved)
      }
    })
  }, [setPanelWidth])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragging.current = true
      startX.current = e.clientX
      startWidth.current = panelWidth

      function onMouseMove(e: MouseEvent) {
        if (!dragging.current) return
        const delta = e.clientX - startX.current
        const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta))
        setPanelWidth(next)
      }

      function onMouseUp() {
        dragging.current = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        chrome.storage.local.set({ [STORAGE_KEY]: latestWidth.current })
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [panelWidth, setPanelWidth]
  )

  return (
    <div
      className={`${styles.panel} ${!panelVisible ? styles.hidden : ''}`}
      style={{ width: panelVisible ? panelWidth : 0 }}
    >
      <PanelHeader />
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        Panel Content
      </div>
      <div className={styles.resizeHandle} onMouseDown={onMouseDown} />
    </div>
  )
}
