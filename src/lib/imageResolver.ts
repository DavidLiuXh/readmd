const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120'%3E%3Crect width='200' height='120' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EImage not found%3C/text%3E%3C/svg%3E"

export async function resolveLocalImages(
  rawMarkdown: string,
  rootHandle: FileSystemDirectoryHandle,
  filePathSegments: string[]
): Promise<{ markdown: string; cache: Map<string, string> }> {
  const cache = new Map<string, string>()
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  const fileDir = filePathSegments.slice(0, -1)

  const matches: { src: string }[] = []
  let match: RegExpExecArray | null
  while ((match = imgRegex.exec(rawMarkdown)) !== null) {
    const src = match[2].trim()
    if (!/^https?:\/\//i.test(src) && !src.startsWith('data:')) {
      matches.push({ src })
    }
  }

  await Promise.all(
    matches.map(async ({ src }) => {
      if (cache.has(src)) return
      try {
        const blobUrl = await getFileAsBlobUrl(rootHandle, fileDir, src)
        if (blobUrl) cache.set(src, blobUrl)
      } catch {
        // 找不到的图片后续替换为占位符
      }
    })
  )

  const resolved = rawMarkdown.replace(imgRegex, (full, alt, src) => {
    const trimmed = src.trim()
    if (cache.has(trimmed)) return `![${alt}](${cache.get(trimmed)})`
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return full
    return `![${alt}](${PLACEHOLDER})`
  })

  return { markdown: resolved, cache }
}

async function getFileAsBlobUrl(
  rootHandle: FileSystemDirectoryHandle,
  fileDir: string[],
  relativePath: string
): Promise<string | null> {
  const parts = [...fileDir, ...relativePath.split('/')]
  const normalized: string[] = []
  for (const part of parts) {
    if (part === '..') normalized.pop()
    else if (part && part !== '.') normalized.push(part)
  }

  if (normalized.length === 0) return null

  let current: FileSystemDirectoryHandle = rootHandle
  for (let i = 0; i < normalized.length - 1; i++) {
    current = await current.getDirectoryHandle(normalized[i])
  }
  const fileHandle = await current.getFileHandle(normalized[normalized.length - 1])
  const file = await fileHandle.getFile()
  return URL.createObjectURL(file)
}
