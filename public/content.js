// 注入到本地目录页（file:///path/to/dir/）
// Chrome 打开本地目录时自动生成包含 addRow(...) 调用的 HTML，解析它获取文件列表

(function () {
  // 只在本地目录页运行
  if (location.protocol !== 'file:') return
  if (!location.href.endsWith('/')) return

  // 解析 Chrome 目录页中的 addRow 调用，提取 .md 文件
  function parseMdFiles() {
    const html = document.body.outerHTML
    const regex = /addRow\("(.*?)",\s*"(.*?)",\s*(\d+),\s*(\d+),\s*"([\d.]+ [BkMG]B?)",\s*(\d+),\s*"(.*?)"\);/g
    const mdExts = ['.md', '.mkd', '.markdown', '.mdx']
    const files = []
    const dirUrl = location.href.endsWith('/') ? location.href : location.href + '/'

    let m
    while ((m = regex.exec(html)) !== null) {
      const name = m[1]
      const path = m[2]
      const isFolder = !!parseInt(m[3])
      if (!isFolder && mdExts.some(ext => name.toLowerCase().endsWith(ext))) {
        files.push({ name, url: dirUrl + path })
      }
    }
    return { dirUrl, files }
  }

  const { dirUrl, files } = parseMdFiles()
  if (files.length === 0) return

  // 注入悬浮按钮
  const btn = document.createElement('button')
  btn.textContent = `📖 MD Reader (${files.length} 个文件)`
  btn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 99999;
    padding: 10px 18px;
    background: #0070c9;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-family: -apple-system, sans-serif;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    transition: background 0.15s;
  `
  btn.onmouseenter = () => btn.style.background = '#005fa3'
  btn.onmouseleave = () => btn.style.background = '#0070c9'
  btn.onclick = () => {
    const readerUrl = chrome.runtime.getURL('reader.html') +
      '?dirUrl=' + encodeURIComponent(dirUrl)
    location.href = readerUrl
  }
  document.body.appendChild(btn)
})()
