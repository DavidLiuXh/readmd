chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('reader.html') })
})

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'OPEN_DIR') {
    const url = chrome.runtime.getURL('reader.html') +
      '?dirUrl=' + encodeURIComponent(msg.dirUrl)
    chrome.tabs.create({ url })
  }
  if (msg.type === 'OPEN_FILE' && sender.tab?.id) {
    const url = chrome.runtime.getURL('reader.html') +
      '?fileUrl=' + encodeURIComponent(msg.fileUrl)
    chrome.tabs.update(sender.tab.id, { url })
  }
})
