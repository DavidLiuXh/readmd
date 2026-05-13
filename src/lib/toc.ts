export interface TocItem {
  id: string
  text: string
  level: number
}

export function extractToc(html: string): { html: string; items: TocItem[] } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings = doc.querySelectorAll('h1, h2, h3')
  const items: TocItem[] = []

  headings.forEach((el, index) => {
    const id = `toc-${index}`
    el.id = id
    const level = parseInt(el.tagName[1], 10)
    items.push({ id, text: el.textContent?.trim() ?? '', level })
  })

  return { html: doc.body.innerHTML, items }
}
