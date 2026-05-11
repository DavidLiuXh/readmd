import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import styles from './MarkdownViewer.module.css'

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

export default function RenderedContent({ html }: Props) {
  const ref = useRef<HTMLDivElement>(null)

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
  }, [html])

  return (
    <div
      ref={ref}
      className={styles.content}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
