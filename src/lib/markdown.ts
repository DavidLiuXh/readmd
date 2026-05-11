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
  // text 此时已经是 markedHighlight 处理过的 HTML，不能再次调用 hljs.highlight()
  const renderer: Partial<Renderer> = {
    code({ text, lang }) {
      const language = lang || ''
      const langLabel = language
        ? `<span class="code-block-lang">${language}</span>`
        : ''
      return `<div class="code-block-wrapper">${langLabel}<pre><code class="hljs language-${language}">${text}</code></pre></div>`
    },
  }
  marked.use({ renderer })
}

export async function renderMarkdown(markdown: string): Promise<string> {
  initMarkdown()
  return marked.parse(markdown) as string
}
