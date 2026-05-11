import { marked } from 'marked'
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
}

export async function renderMarkdown(markdown: string): Promise<string> {
  initMarkdown()
  return marked.parse(markdown) as string
}
