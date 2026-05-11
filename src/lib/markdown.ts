import { marked, type Renderer } from 'marked'
import { markedHighlight } from 'marked-highlight'
import markedKatex from 'marked-katex-extension'
import hljs from 'highlight.js'

let initialized = false

export function initMarkdown(): void {
  if (initialized) return
  initialized = true

  marked.use(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext'
        return hljs.highlight(code, { language }).value
      },
    })
  )

  marked.use(
    markedKatex({
      throwOnError: false,
      output: 'html',
    })
  )

  // 给代码块加语言标签包裹层
  const renderer: Partial<Renderer> = {
    code({ text, lang }) {
      const language = lang || ''
      const highlighted = language && hljs.getLanguage(language)
        ? hljs.highlight(text, { language }).value
        : text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const langLabel = language
        ? `<span class="code-block-lang">${language}</span>`
        : ''
      return `<div class="code-block-wrapper">${langLabel}<pre><code class="hljs language-${language}">${highlighted}</code></pre></div>`
    },
  }
  marked.use({ renderer })
}

export async function renderMarkdown(markdown: string): Promise<string> {
  initMarkdown()
  return marked.parse(markdown) as string
}
